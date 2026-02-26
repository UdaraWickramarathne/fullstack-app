/**
 * Simple Node.js Stress Test for Concurrent User Logins
 * No external dependencies required (uses built-in fetch)
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const CONCURRENT_USERS = parseInt(process.env.CONCURRENT_USERS) || 100;
const ITERATIONS = parseInt(process.env.ITERATIONS) || 1;

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Test statistics
const stats = {
  totalRequests: 0,
  successfulLogins: 0,
  failedLogins: 0,
  registrationSuccess: 0,
  registrationFailed: 0,
  responseTimes: [],
  errors: [],
};

// Generate random test user
function generateTestUser() {
  const randomId = Math.floor(Math.random() * 1000000);
  return {
    email: `stresstest${randomId}@example.com`,
    password: 'StressTest123!',
    name: `Stress Test User ${randomId}`,
  };
}

// Register a user
async function registerUser(user) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    });

    const data = await response.json();
    const duration = Date.now() - startTime;

    if (response.status === 201) {
      stats.registrationSuccess++;
      return { success: true, user, duration };
    } else {
      stats.registrationFailed++;
      return { success: false, error: data.message, duration };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    stats.registrationFailed++;
    stats.errors.push({ type: 'registration', error: error.message });
    return { success: false, error: error.message, duration };
  }
}

// Login a user
async function loginUser(user) {
  const startTime = Date.now();
  stats.totalRequests++;

  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        password: user.password,
      }),
    });

    const data = await response.json();
    const duration = Date.now() - startTime;
    stats.responseTimes.push(duration);

    if (response.status === 200 && data.token) {
      stats.successfulLogins++;
      return { success: true, token: data.token, duration };
    } else {
      stats.failedLogins++;
      return { success: false, error: data.message, duration };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    stats.responseTimes.push(duration);
    stats.failedLogins++;
    stats.errors.push({ type: 'login', error: error.message });
    return { success: false, error: error.message, duration };
  }
}

// Test authenticated endpoint
async function testAuthenticatedEndpoint(token) {
  const startTime = Date.now();

  try {
    const response = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const duration = Date.now() - startTime;
    return { success: response.status === 200, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    stats.errors.push({ type: 'auth_me', error: error.message });
    return { success: false, duration };
  }
}

// Simulate a single user flow
async function simulateUser(userId) {
  const user = generateTestUser();

  // Step 1: Register
  const registerResult = await registerUser(user);
  
  if (!registerResult.success) {
    console.log(`${colors.red}✗${colors.reset} User ${userId}: Registration failed - ${registerResult.error}`);
    return;
  }

  // Step 2: Login (main stress test target)
  const loginResult = await loginUser(user);
  
  if (!loginResult.success) {
    console.log(`${colors.red}✗${colors.reset} User ${userId}: Login failed - ${loginResult.error}`);
    return;
  }

  // Step 3: Test authenticated endpoint
  await testAuthenticatedEndpoint(loginResult.token);

  console.log(`${colors.green}✓${colors.reset} User ${userId}: Complete (Login: ${loginResult.duration}ms)`);
}

// Calculate statistics
function calculateStats() {
  const sortedTimes = stats.responseTimes.sort((a, b) => a - b);
  const total = sortedTimes.length;

  return {
    total: stats.totalRequests,
    successful: stats.successfulLogins,
    failed: stats.failedLogins,
    successRate: ((stats.successfulLogins / stats.totalRequests) * 100).toFixed(2),
    avgResponseTime: (sortedTimes.reduce((a, b) => a + b, 0) / total).toFixed(2),
    minResponseTime: sortedTimes[0] || 0,
    maxResponseTime: sortedTimes[total - 1] || 0,
    p50: sortedTimes[Math.floor(total * 0.5)] || 0,
    p95: sortedTimes[Math.floor(total * 0.95)] || 0,
    p99: sortedTimes[Math.floor(total * 0.99)] || 0,
  };
}

// Print results
function printResults() {
  const calculated = calculateStats();

  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bright}${colors.cyan}STRESS TEST RESULTS${colors.reset}`);
  console.log('='.repeat(60));
  
  console.log(`\n${colors.bright}Configuration:${colors.reset}`);
  console.log(`  Target URL:        ${BASE_URL}`);
  console.log(`  Concurrent Users:  ${CONCURRENT_USERS}`);
  console.log(`  Iterations:        ${ITERATIONS}`);

  console.log(`\n${colors.bright}Registration:${colors.reset}`);
  console.log(`  Successful:        ${colors.green}${stats.registrationSuccess}${colors.reset}`);
  console.log(`  Failed:            ${colors.red}${stats.registrationFailed}${colors.reset}`);

  console.log(`\n${colors.bright}Login Requests:${colors.reset}`);
  console.log(`  Total:             ${calculated.total}`);
  console.log(`  Successful:        ${colors.green}${calculated.successful}${colors.reset}`);
  console.log(`  Failed:            ${colors.red}${calculated.failed}${colors.reset}`);
  console.log(`  Success Rate:      ${calculated.successRate}%`);

  console.log(`\n${colors.bright}Response Times (Login):${colors.reset}`);
  console.log(`  Average:           ${calculated.avgResponseTime}ms`);
  console.log(`  Min:               ${calculated.minResponseTime}ms`);
  console.log(`  Max:               ${calculated.maxResponseTime}ms`);
  console.log(`  Median (p50):      ${calculated.p50}ms`);
  console.log(`  95th percentile:   ${calculated.p95}ms`);
  console.log(`  99th percentile:   ${calculated.p99}ms`);

  if (stats.errors.length > 0) {
    console.log(`\n${colors.bright}${colors.red}Errors (${stats.errors.length}):${colors.reset}`);
    const errorSummary = {};
    stats.errors.forEach(e => {
      const key = `${e.type}: ${e.error}`;
      errorSummary[key] = (errorSummary[key] || 0) + 1;
    });
    Object.entries(errorSummary).forEach(([error, count]) => {
      console.log(`  ${error} (×${count})`);
    });
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Performance assessment
  if (calculated.successRate >= 95 && calculated.p95 < 500) {
    console.log(`${colors.green}✓ EXCELLENT:${colors.reset} System handled concurrent load well!`);
  } else if (calculated.successRate >= 90 && calculated.p95 < 1000) {
    console.log(`${colors.yellow}⚠ GOOD:${colors.reset} System handled load but could be optimized.`);
  } else {
    console.log(`${colors.red}✗ NEEDS IMPROVEMENT:${colors.reset} System struggled with concurrent load.`);
  }
  console.log('');
}

// Main test runner
async function runStressTest() {
  console.log(`${colors.bright}${colors.blue}Starting Stress Test...${colors.reset}`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Simulating ${CONCURRENT_USERS} concurrent users x ${ITERATIONS} iteration(s)\n`);

  // Check if server is reachable
  try {
    const healthCheck = await fetch(`${BASE_URL}/health`);
    if (!healthCheck.ok) {
      console.error(`${colors.red}✗ Server health check failed!${colors.reset}`);
      process.exit(1);
    }
    console.log(`${colors.green}✓ Server is reachable${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}✗ Cannot reach server: ${error.message}${colors.reset}`);
    console.error('Make sure the backend server is running.\n');
    process.exit(1);
  }

  const startTime = Date.now();

  for (let iteration = 0; iteration < ITERATIONS; iteration++) {
    if (ITERATIONS > 1) {
      console.log(`\n${colors.cyan}Iteration ${iteration + 1}/${ITERATIONS}${colors.reset}`);
    }

    // Create array of user simulation promises
    const userPromises = [];
    for (let i = 0; i < CONCURRENT_USERS; i++) {
      userPromises.push(simulateUser(i + 1));
    }

    // Execute all users concurrently
    await Promise.all(userPromises);
  }

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n${colors.bright}Total test duration: ${totalDuration}s${colors.reset}`);

  printResults();
}

// Run the test
runStressTest().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
