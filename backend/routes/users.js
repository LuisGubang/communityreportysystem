/**
 * Users Routes
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');
const User = require('../models/User');

/**
 * GET /api/users
 * Get all users (admin only)
 */
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status, type, page = 1, limit = 100 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (type) filter.role = type === 'citizen' ? 'user' : type;

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.max(parseInt(limit, 10) || 100, 1);

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber),
      User.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: users.map(user => user.getSafeData()),
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        pages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve users' });
  }
});

/**
 * GET /api/users/:id
 * Get user profile
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user.getSafeData() });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve user' });
  }
});

/**
 * PUT /api/users/:id
 * Update user profile
 */
router.put('/:id', authenticate, [
  body('name').optional().trim(),
  body('phone').optional().trim(),
  body('email').optional().isEmail().normalizeEmail(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const allowedUpdates = ['name', 'phone', 'email'];
    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    logger.info(`User ${req.params.id} profile updated`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user.getSafeData()
    });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

/**
 * DELETE /api/users/:id
 * Delete user (admin only)
 */
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    logger.info(`User ${req.params.id} deleted`);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

/**
 * PATCH /api/users/:id/status
 * Update user status (admin only)
 */
router.patch('/:id/status', authenticate, authorize('admin'), [
  body('status').isIn(['active', 'inactive', 'suspended'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    logger.info(`User ${req.params.id} status changed to ${req.body.status}`);

    res.json({
      success: true,
      message: 'User status updated',
      data: user.getSafeData()
    });
  } catch (error) {
    logger.error('Update user status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update user status' });
  }
});

module.exports = router;
