const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const { connectDatabase } = require('./config/database');
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
    app.listen(config.server.port, config.server.host, () => {
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

startServer();
