const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection with best practices
async function connectDatabase() {
  try {
    // Close existing connections before creating new ones
    if (mongoose.connection.readyState !== 0) {
      console.log('⚠️  Existing connection detected, closing...');
      await disconnectDatabase();
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB connected successfully');
    
    // Set up connection event listeners
    setupConnectionListeners();
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
}

// Setup connection event listeners
function setupConnectionListeners() {
  const connection = mongoose.connection;
  
  connection.on('disconnected', () => {
    console.log('⚠️  MongoDB disconnected');
  });
  
  connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
  });
  
  connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected');
  });
}

// Gracefully disconnect from database
async function disconnectDatabase() {
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed gracefully');
    return true;
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error.message);
    return false;
  }
}

// Get connection
function getConnection() {
  return mongoose.connection;
}

// Check if database is connected
function isConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = { 
  connectDatabase, 
  disconnectDatabase, 
  getConnection, 
  isConnected 
};
