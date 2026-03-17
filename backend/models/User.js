const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema for MongoDB
 * Stores user profiles with authentication and role-based data
 */
const userSchema = new mongoose.Schema({
  // Basic Information
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false // Don't return password by default
  },
  
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  
  phone: {
    type: String,
    default: null
  },
  
  // Role and Permissions
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  
  // Admin-specific fields
  agency: {
    type: String,
    default: null
  },
  
  jurisdiction: {
    type: String,
    default: null
  },
  
  // Account Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  
  profileImageUrl: {
    type: String,
    default: null
  },
  
  // Login tracking
  loginCount: {
    type: Number,
    default: 0
  },
  
  lastLogin: {
    type: Date,
    default: null
  },
  
  loginHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

/**
 * Hash password before saving
 */
userSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.updatedAt = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare password method
 * @param {String} enteredPassword - Password to compare
 * @returns {Promise<Boolean>} - True if password matches
 */
userSchema.methods.comparePassword = async function(enteredPassword) {
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

/**
 * Track login
 * @param {Object} loginInfo - Login timestamp and IP info
 */
userSchema.methods.trackLogin = function(loginInfo = {}) {
  this.loginCount += 1;
  this.lastLogin = new Date();
  
  if (loginInfo.ipAddress || loginInfo.userAgent) {
    this.loginHistory.push({
      timestamp: new Date(),
      ipAddress: loginInfo.ipAddress || 'unknown',
      userAgent: loginInfo.userAgent || 'unknown'
    });
  }
  
  return this.save();
};

/**
 * Get user JSON (without password)
 */
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

/**
 * Get safe user data (for responses)
 */
userSchema.methods.getSafeData = function() {
  return {
    id: this._id,
    email: this.email,
    name: this.name,
    phone: this.phone,
    role: this.role,
    agency: this.agency,
    jurisdiction: this.jurisdiction,
    status: this.status,
    profileImageUrl: this.profileImageUrl,
    loginCount: this.loginCount,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);
