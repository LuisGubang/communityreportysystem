/**
 * Community Reporting System - Express Server
 * Main entry point for the backend API with MongoDB
 */

require('express-async-errors');
require('dotenv').config();

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const User = require('./models/User');

// Initialize Express app
const app = express();

// Respect reverse-proxy headers (nginx/tunnel) for accurate rate limiting and IP detection.
app.set('trust proxy', 1);

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Response compression
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 1000),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// ==================== MONGODB CONNECTION ====================

/**
 * Connect to MongoDB
 */
async function connectMongoDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI not provided in .env file');
    }
    
    console.log('\n🔄 Connecting to MongoDB...');
    console.log(`   URI: ${mongoUri.replace(/:[^:]*@/, ':****@')}`); // Hide password
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || 50),
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || 5),
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB Connected Successfully!');
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    
    logger.success('MongoDB connection established', {
      database: mongoose.connection.name
    });

    await ensureDemoUsers();
    
  } catch (error) {
    console.error('❌ MongoDB Connection Failed!');
    console.error(`   Error: ${error.message}`);
    logger.error('MongoDB connection failed', error);
    
    // Retry in 5 seconds
    console.log('⏳ Retrying connection in 5 seconds...\n');
    setTimeout(connectMongoDB, 5000);
  }
}

async function ensureDemoUsers() {
  const demoUsers = [
    {
      email: 'user@test.com',
      password: 'password123',
      name: 'John Doe',
      phone: '0000000000',
      role: 'user'
    },
    {
      email: 'admin@test.com',
      password: 'admin123',
      name: 'Admin Officer',
      phone: '0000000001',
      role: 'admin',
      agency: 'Community Response Unit',
      jurisdiction: 'Central'
    }
  ];

  for (const demoUser of demoUsers) {
    const existingUser = await User.findOne({ email: demoUser.email });
    if (existingUser) continue;
    await User.create(demoUser);
    logger.info(`Seeded demo user: ${demoUser.email}`);
  }
}

// Connect to MongoDB on startup
connectMongoDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/users', require('./routes/users'));
app.use('/api/notifications', require('./routes/notifications'));

// Serve frontend assets/pages from project root to support single-origin public sharing.
const frontendRoot = path.resolve(__dirname, '..');
app.use(express.static(frontendRoot, { index: false }));

// Health check
app.get('/api/health', (req, res) => {
  const mongooseState = mongoose.connection.readyState;
  const mongoConnected = mongooseState === 1; // 1 = connected
  
  res.status(200).json({
    status: mongoConnected ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      mongodb: mongoConnected ? 'connected' : 'disconnected',
      mongooseState: mongooseState,
      name: mongoose.connection.name || 'unknown'
    }
  });
});

// Database status endpoint
app.get('/api/status', (req, res) => {
  const mongooseState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({
    status: states[mongooseState] || 'unknown',
    mongodb: {
      state: states[mongooseState],
      name: mongoose.connection.name,
      host: mongoose.connection.host,
      port: mongoose.connection.port
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendRoot, 'index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('\n❌ Error:', err.message);
  
  logger.error('Error:', {
    message: err.message,
    path: req.path,
    method: req.method
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: messages
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
      field: field
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Community Reporting System API');
  console.log('='.repeat(60));
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(60) + '\n');
  
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  // Close server & exit process
  server.close(async () => {
    await mongoose.disconnect();
    process.exit(1);
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  console.log('\n⚠️  Shutting down gracefully...\n');
  
  server.close(async () => {
    logger.info('HTTP server closed');
    try {
      await mongoose.disconnect();
      console.log('✅ MongoDB disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting MongoDB:', error);
    }
    process.exit(0);
  });
});

module.exports = app;
