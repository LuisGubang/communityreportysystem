/**
 * Authentication Routes
 * User registration and login with MongoDB
 */

const express = require('express');
const router = express.Router();
const { validationResult, body } = require('express-validator');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').optional().notEmpty(),
  body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error',
        errors: errors.array() 
      });
    }

    const { email, password, name, phone, role = 'user', agency, jurisdiction, adminCode } = req.body;

    // Validate admin registration
    if (role === 'admin') {
      const expectedAdminCode = process.env.ADMIN_REGISTRATION_CODE || 'ADMIN2026';
      if (adminCode !== expectedAdminCode) {
        return res.status(403).json({ 
          success: false, 
          message: 'Invalid admin registration code' 
        });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    // Create new user
    const user = new User({
      email,
      password,
      name,
      phone,
      role,
      agency: role === 'admin' ? agency : null,
      jurisdiction: role === 'admin' ? jurisdiction : null,
      status: 'active'
    });

    // Save user (password will be hashed by pre-save hook)
    await user.save();

    logger.info(`User registered: ${email} (${role})`);

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: user.getSafeData(),
      token,
      refreshToken
    });

  } catch (error) {
    logger.error('Registration error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/auth/login
 * User login with email and password
 */
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error',
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn(`Failed login attempt for user: ${email}`);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check user status
    if (user.status !== 'active') {
      logger.warn(`Login attempt by inactive user: ${email} (status: ${user.status})`);
      return res.status(403).json({ 
        success: false, 
        message: 'User account is not active. Please contact support.' 
      });
    }

    // Track login
    await user.trackLogin({
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    logger.info(`User logged in: ${email}`);

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      user: user.getSafeData(),
      token,
      refreshToken
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh JWT access token using refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Refresh token is required' 
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Generate new access token
    const newToken = generateToken(user);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      token: newToken
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Refresh token expired' 
      });
    }

    res.status(401).json({ 
      success: false, 
      message: 'Invalid refresh token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/auth/logout
 * User logout (revoke token)
 */
router.post('/logout', authenticate, (req, res) => {
  try {
    // In production, add to token blacklist
    logger.info(`User logged out: ${req.user.email}`);
    
    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Logout failed' 
    });
  }
});

/**
 * GET /api/auth/verify
 * Verify current JWT token and return user data
 */
router.get('/verify', authenticate, async (req, res) => {
  try {
    // req.user is set by authenticate middleware
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: user.getSafeData()
    });
  } catch (error) {
    logger.error('Verify error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Verification failed' 
    });
  }
});

/**
 * Helper function to generate JWT access token
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
}

/**
 * Helper function to generate refresh token
 */
function generateRefreshToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '30d' }
  );
}

module.exports = router;
