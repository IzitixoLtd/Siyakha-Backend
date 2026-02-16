/**
 * MongoDB Database Connection
 */

const mongoose = require('mongoose');
const { env } = require('./env');

mongoose.set('strictQuery', true);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.mongodbUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
};

const disconnectDB = async () => {
  await mongoose.connection.close();
  console.log('MongoDB disconnected');
};

module.exports = { connectDB, disconnectDB, mongoose };
