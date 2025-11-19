const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const { connectDatabase, disconnectDatabase } = require('./config/database');
const { initializeDatabase } = require('./config/initDB');

// Import routes
const authRoutes = require('./routes/auth');
const galleryRoutes = require('./routes/gallery');
const newsRoutes = require('./routes/news');
const careersRoutes = require('./routes/careers');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration from centralized config
app.use(cors(config.cors));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/careers', careersRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'King Arthur Capital API is running',
    environment: config.env,
    version: config.api.version
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
let server;

async function startServer() {
  try {
    // Connect to MongoDB
    const connected = await connectDatabase();
    
    if (!connected) {
      console.error('❌ Failed to connect to MongoDB. Please check your .env configuration.');
      console.log('\n💡 Tips:');
      console.log('   - For local MongoDB: Make sure MongoDB is running (mongod)');
      console.log('   - For MongoDB Atlas: Check your connection string and IP whitelist\n');
      process.exit(1);
    }
    
    // Initialize database collections
    await initializeDatabase();
    
    // Start server
    server = app.listen(config.server.port, config.server.host, () => {
      console.log(`\n🚀 Server running on port ${config.server.port}`);
      console.log(`📍 Environment: ${config.env}`);
      console.log(`🔗 API Base URL: ${config.getApiUrl()}`);
      console.log(`🗄️  Database: MongoDB (GridFS for images)`);
      console.log(`\n📋 Available endpoints:`);
      console.log(`   POST   /api/auth/login`);
      console.log(`   GET    /api/auth/verify`);
      console.log(`   GET    /api/gallery`);
      console.log(`   GET    /api/gallery/image/:id`);
      console.log(`   POST   /api/gallery (protected)`);
      console.log(`   PUT    /api/gallery/:id (protected)`);
      console.log(`   DELETE /api/gallery/:id (protected)`);
      console.log(`   GET    /api/news`);
      console.log(`   GET    /api/news/image/:id`);
      console.log(`   POST   /api/news (protected)`);
      console.log(`   PUT    /api/news/:id (protected)`);
      console.log(`   DELETE /api/news/:id (protected)`);
      console.log(`\n✨ Ready to accept requests!\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown handler
async function gracefulShutdown(signal) {
  console.log(`\n📡 ${signal} signal received: closing HTTP server`);
  
  // Stop accepting new connections
  if (server) {
    server.close(async () => {
      console.log('🔒 HTTP server closed');
      
      // Close database connection
      await disconnectDatabase();
      
      console.log('👋 Process terminated gracefully');
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      console.error('⚠️  Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  } else {
    await disconnectDatabase();
    process.exit(0);
  }
}

// Handle process termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  console.error('❌ Uncaught Exception:', error);
  await disconnectDatabase();
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  await disconnectDatabase();
  process.exit(1);
});

startServer();
