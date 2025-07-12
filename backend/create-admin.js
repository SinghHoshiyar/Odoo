const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillswap');
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@skillswap.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      existingAdmin.isAdmin = true;
      await existingAdmin.save();
      console.log('Admin status updated');
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@skillswap.com',
      password: 'admin123456', // This will be hashed automatically
      isAdmin: true,
      isActive: true,
      location: 'System'
    });

    await adminUser.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@skillswap.com');
    console.log('Password: admin123456');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
