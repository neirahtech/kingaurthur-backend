const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
}

// Get connection
function getConnection() {
  return mongoose.connection;
}

module.exports = { connectDatabase, getConnection };
