const mongoose = require('mongoose');
const logger = require('./logger');

const isDeployed = () =>
  process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    const message = 'MONGODB_URI is not set in environment variables';
    logger.error(message);
    if (isDeployed()) {
      throw new Error(message);
    }
    logger.warn('Development mode: running without database');
    return false;
  }

  // Fail immediately instead of buffering queries for 10s when disconnected
  mongoose.set('bufferCommands', false);

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 1,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host} / ${conn.connection.name}`);
    return true;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    logger.info('Atlas checklist:');
    logger.info('1. Network Access → allow 0.0.0.0/0 (required for Render)');
    logger.info('2. MONGODB_URI includes /civiconnect before the query string');
    logger.info('3. Username and password are correct (no extra spaces)');

    throw error;
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
module.exports.isDeployed = isDeployed;
