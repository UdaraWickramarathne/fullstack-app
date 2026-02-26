import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 100 }, // Ramp up to 100 users over 30 seconds
    { duration: '1m', target: 100 },  // Stay at 100 users for 1 minute
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate should be less than 10%
    errors: ['rate<0.1'],
  },
};

// Base URL - change this to match your environment
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

// Test data
function generateTestUser() {
  const randomId = Math.floor(Math.random() * 1000000);
  return {
    email: `loadtest${randomId}@example.com`,
    password: 'testPassword123',
    name: `LoadTest User ${randomId}`,
  };
}

// Setup function - runs once per VU at the start
export function setup() {
  console.log(`Starting load test against ${BASE_URL}`);
  console.log('Testing with 100 concurrent users');
  return { baseUrl: BASE_URL };
}

// Main test function - runs for each VU iteration
export default function (data) {
  const user = generateTestUser();

  // Step 1: Register a new user
  const registerPayload = JSON.stringify(user);
  const registerParams = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const registerRes = http.post(
    `${data.baseUrl}/api/auth/register`,
    registerPayload,
    registerParams
  );

  const registerSuccess = check(registerRes, {
    'registration status is 201 or 400': (r) => r.status === 201 || r.status === 400,
    'registration response has body': (r) => r.body.length > 0,
  });

  errorRate.add(!registerSuccess);

  // Small delay between registration and login
  sleep(0.5);

  // Step 2: Login with the user (main stress test target)
  const loginPayload = JSON.stringify({
    email: user.email,
    password: user.password,
  });

  const loginParams = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const loginRes = http.post(
    `${data.baseUrl}/api/auth/login`,
    loginPayload,
    loginParams
  );

  const loginSuccess = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login has token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.token !== undefined;
      } catch (e) {
        return false;
      }
    },
    'login response time < 500ms': (r) => r.timings.duration < 500,
    'login response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  errorRate.add(!loginSuccess);

  if (loginSuccess && loginRes.status === 200) {
    try {
      const loginData = JSON.parse(loginRes.body);
      const token = loginData.token;

      // Step 3: Make an authenticated request to /api/auth/me
      const meParams = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      };

      const meRes = http.get(`${data.baseUrl}/api/auth/me`, meParams);

      const meSuccess = check(meRes, {
        'auth/me status is 200': (r) => r.status === 200,
        'auth/me returns user data': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.email === user.email;
          } catch (e) {
            return false;
          }
        },
      });

      errorRate.add(!meSuccess);
    } catch (e) {
      console.error('Error parsing login response:', e);
      errorRate.add(true);
    }
  }

  // Think time - simulate real user behavior
  sleep(1);
}

// Teardown function - runs once at the end
export function teardown(data) {
  console.log('Load test completed');
  console.log(`Total requests sent to ${data.baseUrl}`);
}
