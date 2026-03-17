const mongoose = require('mongoose');

/**
 * Report Schema for MongoDB
 * Stores incident reports with location and status tracking
 */
const reportSchema = new mongoose.Schema({
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow anonymous reports
  },
  
  // Report Details
  incidentType: {
    type: String,
    enum: ['crime', 'flood', 'fire', 'accident', 'other'],
    required: [true, 'Please specify incident type']
  },
  
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    maxlength: 200
  },
  
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    maxlength: 5000
  },
  
  // Location Information
  location: {
    type: String,
    required: [true, 'Please provide location']
  },
  
  coordinates: {
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    }
  },
  
  // Media
  photos: [String], // Array of photo URLs
  
  // Report Settings
  anonymous: {
    type: Boolean,
    default: false
  },
  
  // Status Management
  status: {
    type: String,
    enum: ['submitted', 'under-review', 'resolved', 'rejected'],
    default: 'submitted'
  },
  
  statusUpdates: [{
    status: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String,
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Verification/Upvoting
  verificationCount: {
    type: Number,
    default: 0
  },
  
  verifications: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Metadata
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  resolutionTime: {
    type: Number, // in hours
    default: null
  },
  
  // Timestamps
  dateSubmitted: {
    type: Date,
    default: Date.now
  },
  
  dateResolved: {
    type: Date,
    default: null
  },
  
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
reportSchema.index({ userId: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ incidentType: 1 });
reportSchema.index({ dateSubmitted: -1 });
reportSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });

/**
 * Calculate resolution time when resolved
 */
reportSchema.pre('save', function(next) {
  if (this.status === 'resolved' && this.dateResolved && this.dateSubmitted) {
    const timeInMs = this.dateResolved - this.dateSubmitted;
    this.resolutionTime = Math.round(timeInMs / (1000 * 60 * 60)); // Convert to hours
  }
  this.updatedAt = Date.now();
  next();
});

/**
 * Update verification count
 */
reportSchema.methods.addVerification = function(userId) {
  // Check if user already verified
  const alreadyVerified = this.verifications.some(v => 
    v.userId.toString() === userId.toString()
  );
  
  if (!alreadyVerified) {
    this.verifications.push({ userId });
    this.verificationCount = this.verifications.length;
  }
  
  return this.save();
};

/**
 * Update status with notes
 */
reportSchema.methods.updateStatus = function(newStatus, adminId, notes = '') {
  if (!['submitted', 'under-review', 'resolved', 'rejected'].includes(newStatus)) {
    throw new Error('Invalid status');
  }
  
  if (newStatus === 'resolved' && !this.dateResolved) {
    this.dateResolved = new Date();
  }
  
  this.status = newStatus;
  this.statusUpdates.push({
    status: newStatus,
    updatedBy: adminId,
    notes: notes
  });
  
  return this.save();
};

/**
 * Get safe report data
 */
reportSchema.methods.getSafeData = function() {
  return {
    id: this._id,
    userId: this.userId,
    incidentType: this.incidentType,
    title: this.title,
    description: this.description,
    location: this.location,
    coordinates: this.coordinates,
    photos: this.photos,
    anonymous: this.anonymous,
    status: this.status,
    verificationCount: this.verificationCount,
    priority: this.priority,
    resolutionTime: this.resolutionTime,
    dateSubmitted: this.dateSubmitted,
    dateResolved: this.dateResolved,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('Report', reportSchema);
