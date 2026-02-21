import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const createAdminUser = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ role: 'admin' });

    if (adminExists) {
      console.log('✓ Admin user already exists');
      return;
    }

    // Create default admin user
    const adminUser = await User.create({
      name: process.env.ADMIN_NAME || 'Admin User',
      email: process.env.ADMIN_EMAIL || 'admin@velora.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin',
      phone: '+1234567890'
    });

    console.log('✓ Admin user created successfully');
    console.log(`  Email: ${adminUser.email}`);
    console.log(`  Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    console.log('  ⚠️  Please change the default password after first login!');
  } catch (error) {
    console.error('✗ Error creating admin user:', error.message);
  }
};

export default createAdminUser;
