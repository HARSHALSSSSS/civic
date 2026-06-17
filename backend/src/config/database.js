const mongoose = require('mongoose');
const logger = require('./logger');

const isProduction = process.env.NODE_ENV === 'production';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    const message = 'MONGODB_URI is not set in environment variables';
    logger.error(message);
    if (isProduction) {
      throw new Error(message);
    }
    logger.warn('Development mode: running without database');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host} / ${conn.connection.name}`);
    return true;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    logger.info('Atlas checklist:');
    logger.info('1. Network Access → allow 0.0.0.0/0 (required for Render)');
    logger.info('2. MONGODB_URI on Render includes /civiconnect database name');
    logger.info('3. Username and password are correct in the connection string');

    if (isProduction) {
      throw error;
    }

    logger.warn('Development mode: continuing without database');
    return false;
  }
};

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

const isDatabaseConnected = () => mongoose.connection.readyState === 1;

module.exports = connectDB;
module.exports.isDatabaseConnected = isDatabaseConnected;
