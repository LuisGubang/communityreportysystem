/**
 * Notifications Routes
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

// Mock database
const notifications = [];

/**
 * GET /api/notifications
 * Get user's notifications
 */
router.get('/', authenticate, (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const userNotifications = notifications.filter(n => n.userId === req.user.id);

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedNotifications = userNotifications
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(startIndex, startIndex + limit);

    res.json({
      success: true,
      data: paginatedNotifications,
      pagination: {
        total: userNotifications.length,
        page: parseInt(page),
        limit: parseInt(limit),
        unread: userNotifications.filter(n => !n.read).length
      }
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve notifications' });
  }
});

/**
 * POST /api/notifications/send
 * Send notification (admin only)
 */
router.post('/send', authenticate, authorize('admin'), [
  body('userId').notEmpty(),
  body('type').isIn(['email', 'sms', 'push']),
  body('message').notEmpty(),
  body('title').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { userId, type, message, title, reportId } = req.body;

    const notification = {
      id: `NOTIF-${Date.now()}`,
      userId,
      type,
      title,
      message,
      reportId,
      read: false,
      createdAt: new Date()
    };

    notifications.push(notification);

    logger.info(`Notification sent to user ${userId}`);

    // In production, would integrate with actual email/SMS/push services
    switch (type) {
      case 'email':
        // await emailService.send(user.email, title, message);
        break;
      case 'sms':
        // await smsService.send(user.phone, message);
        break;
      case 'push':
        // await pushService.send(user.fcmToken, title, message);
        break;
    }

    res.status(201).json({
      success: true,
      message: 'Notification sent',
      data: notification
    });
  } catch (error) {
    logger.error('Send notification error:', error);
    res.status(500).json({ success: false, error: 'Failed to send notification' });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
router.patch('/:id/read', authenticate, (req, res) => {
  try {
    const notification = notifications.find(n => n.id === req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    // Check authorization
    if (notification.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    notification.read = true;

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    logger.error('Mark notification error:', error);
    res.status(500).json({ success: false, error: 'Failed to update notification' });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete notification
 */
router.delete('/:id', authenticate, (req, res) => {
  try {
    const index = notifications.findIndex(n => n.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    const notification = notifications[index];

    // Check authorization
    if (notification.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    notifications.splice(index, 1);

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    logger.error('Delete notification error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete notification' });
  }
});

/**
 * POST /api/notifications/bulk-send
 * Send notification to multiple users (admin only)
 */
router.post('/bulk-send', authenticate, authorize('admin'), [
  body('userIds').isArray(),
  body('type').isIn(['email', 'sms', 'push']),
  body('message').notEmpty(),
  body('title').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { userIds, type, message, title } = req.body;
    const sentNotifications = [];

    // Send to each user
    userIds.forEach(userId => {
      const notification = {
        id: `NOTIF-${Date.now()}-${Math.random()}`,
        userId,
        type,
        title,
        message,
        read: false,
        createdAt: new Date()
      };

      notifications.push(notification);
      sentNotifications.push(notification);
    });

    logger.info(`Bulk notification sent to ${userIds.length} users`);

    res.status(201).json({
      success: true,
      message: `Notification sent to ${userIds.length} users`,
      data: { sent: sentNotifications.length, total: userIds.length }
    });
  } catch (error) {
    logger.error('Bulk send notification error:', error);
    res.status(500).json({ success: false, error: 'Failed to send bulk notifications' });
  }
});

module.exports = router;
