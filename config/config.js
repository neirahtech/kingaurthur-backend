/**
 * Centralized Backend Configuration
 * All environment variables and configuration settings for the backend application
 */

require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'ADMIN_PASSWORD',
];

const validateEnv = () => {
  const missing = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );
  
  if (missing.length > 0) {
    console.error(
      `❌ Error: Missing required environment variables: ${missing.join(', ')}\n` +
      `Please check your .env file and ensure all required variables are set.`
    );
    process.exit(1);
  }

  // Validate JWT secret is strong enough
  if (process.env.JWT_SECRET.length < 32) {
    console.warn(
      `⚠️  Warning: JWT_SECRET should be at least 32 characters long for security.\n` +
      `Current length: ${process.env.JWT_SECRET.length}`
    );
  }

  // Validate admin password is not default
  if (process.env.ADMIN_PASSWORD === 'admin123' && process.env.NODE_ENV === 'production') {
    console.error(
      `❌ Error: Default admin password detected in production!\n` +
      `Please change ADMIN_PASSWORD to a secure value.`
    );
    process.exit(1);
  }
};

// Run validation
validateEnv();

// Server Configuration
const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',

  // Server
  server: {
    port: parseInt(process.env.PORT) || 8085,
    host: process.env.HOST || '0.0.0.0',
  },

  // Database
  database: {
    uri: process.env.MONGODB_URI,
    options: {
      maxPoolSize: parseInt(process.env.DB_POOL_SIZE) || 10,
      serverSelectionTimeoutMS: parseInt(process.env.DB_TIMEOUT) || 5000,
      socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT) || 45000,
    },
  },

  // Authentication
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    adminPassword: process.env.ADMIN_PASSWORD,
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
  },

  // CORS
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? [
          process.env.PRODUCTION_FRONTEND_URL,
          ...(process.env.ADDITIONAL_ALLOWED_ORIGINS?.split(',') || [])
        ].filter(Boolean)
      : [
          process.env.FRONTEND_URL || 'http://localhost:3000',
          'http://localhost:3000',
          'http://localhost:3001',
          'http://127.0.0.1:3000',
        ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400, // 24 hours
  },

  // File Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  },

  // GridFS
  gridfs: {
    bucketName: 'uploads',
    chunkSizeBytes: 261120, // 255KB
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  },

  // Cache
  cache: {
    imageMaxAge: 31536000, // 1 year in seconds
    apiMaxAge: 300, // 5 minutes in seconds
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: process.env.ENABLE_CONSOLE_LOGS !== 'false',
    enableFile: process.env.ENABLE_FILE_LOGS === 'true',
  },

  // Security
  security: {
    enableHelmet: process.env.ENABLE_HELMET !== 'false',
    trustProxy: process.env.TRUST_PROXY === 'true',
    enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
  },

  // API
  api: {
    prefix: '/api',
    version: 'v1',
  },
};

// Helper functions
config.getFullUrl = function() {
  const protocol = this.isProduction ? 'https' : 'http';
  return `${protocol}://${this.server.host}:${this.server.port}`;
};

config.getApiUrl = function(endpoint = '') {
  const base = this.getFullUrl();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${this.api.prefix}${path}`;
};

// Freeze configuration to prevent modifications
Object.freeze(config.server);
Object.freeze(config.database);
Object.freeze(config.auth);
Object.freeze(config.cors);
Object.freeze(config.upload);
Object.freeze(config.gridfs);
Object.freeze(config.rateLimit);
Object.freeze(config.cache);
Object.freeze(config.logging);
Object.freeze(config.security);
Object.freeze(config.api);

module.exports = config;
