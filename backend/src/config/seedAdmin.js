const User = require('../models/User');
const logger = require('./logger');

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@civiconnect.gov.in';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';
const DEFAULT_ADMIN_NAME = process.env.ADMIN_NAME || 'System Administrator';

const seedAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      logger.info(`Admin user already exists: ${existingAdmin.email}`);
      return existingAdmin;
    }

    const admin = await User.create({
      name: DEFAULT_ADMIN_NAME,
      email: DEFAULT_ADMIN_EMAIL,
      password: DEFAULT_ADMIN_PASSWORD,
      role: 'admin',
      phone: process.env.ADMIN_PHONE || '+919876543210',
      isEmailVerified: true,
      isActive: true,
      address: {
        street: 'Civic Center',
        city: 'Municipal Corporation',
        state: 'State',
        postalCode: '000000',
        country: 'India'
      }
    });

    logger.info(`Admin user created successfully: ${admin.email}`);
    return admin;
  } catch (error) {
    logger.error(`Failed to seed admin user: ${error.message}`);
    throw error;
  }
};

module.exports = seedAdmin;
