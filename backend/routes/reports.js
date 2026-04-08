/**
 * Reports Routes
 */

const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');
const Report = require('../models/Report');

/**
 * GET /api/reports
 * Get all reports (admin only) or user's reports
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;

    // Build query filter
    let query = {};

    // Filter by type if provided
    if (type) {
      query.incidentType = type;
    }

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // If not admin, only return user's reports
    if (req.user.role !== 'admin') {
      query.userId = req.user.id;
    }

    // Get total count
    const total = await Report.countDocuments(query);

    // Fetch paginated reports
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.json({
      success: true,
      data: reports,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error('Get reports error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve reports' });
  }
});

/**
 * GET /api/reports/:id
 * Get report by ID
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).lean();

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && report.userId?.toString() !== req.user.id && !report.anonymous) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    logger.error('Get report error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve report' });
  }
});

/**
 * POST /api/reports
 * Submit a new report
 */
router.post('/', authenticate, [
  body('incidentType').notEmpty(),
  body('title').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('location').trim().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { incidentType, title, description, location, anonymous = false, photos = [], coordinates } = req.body;

    // Check rate limiting (max reports per day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const userIdForQuery = anonymous ? null : req.user.id;
    const userReportsToday = await Report.countDocuments({
      userId: userIdForQuery,
      dateSubmitted: { $gte: today, $lt: tomorrow }
    });

    const maxReportsPerDay = parseInt(process.env.MAX_REPORTS_PER_USER || 10);
    if (userReportsToday >= maxReportsPerDay) {
      return res.status(429).json({
        success: false,
        error: `Exceeded limit of ${maxReportsPerDay} reports per day`
      });
    }

    // Create report
    const report = new Report({
      userId: anonymous ? null : req.user.id,
      incidentType,
      title,
      description,
      location,
      coordinates,
      anonymous,
      photos,
      status: 'submitted'
    });

    await report.save();

    logger.info(`Report submitted: ${report._id} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: report
    });
  } catch (error) {
    logger.error('Submit report error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit report' });
  }
});

/**
 * PUT /api/reports/:id
 * Update report status (admin only)
 */
router.put('/:id', authenticate, authorize('admin'), [
  body('status').isIn(['submitted', 'under-review', 'resolved', 'rejected'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { status, notes } = req.body;

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    // Use the updateStatus method from the model
    await report.updateStatus(status, req.user.id, notes);

    logger.info(`Report ${report._id} updated to status: ${status}`);

    res.json({
      success: true,
      message: 'Report updated successfully',
      data: report
    });
  } catch (error) {
    logger.error('Update report error:', error);
    res.status(500).json({ success: false, error: 'Failed to update report' });
  }
});

/**
 * DELETE /api/reports/:id
 * Delete report (admin only)
 */
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    logger.info(`Report ${req.params.id} deleted`);

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    logger.error('Delete report error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete report' });
  }
});

/**
 * POST /api/reports/:id/verify
 * Verify/upvote a report
 */
router.post('/:id/verify', authenticate, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    // Use the addVerification method from the model
    await report.addVerification(req.user.id);

    res.json({
      success: true,
      message: 'Report verified',
      data: { verifications: report.verificationCount }
    });
  } catch (error) {
    logger.error('Verify report error:', error);
    res.status(500).json({ success: false, error: 'Failed to verify report' });
  }
});

/**
 * GET /api/reports/user/:uid
 * Get reports for a specific user
 */
router.get('/user/:uid', authenticate, authorize('admin'), async (req, res) => {
  try {
    const userReports = await Report.find({ userId: req.params.uid }).lean();

    res.json({
      success: true,
      data: userReports,
      count: userReports.length
    });
  } catch (error) {
    logger.error('Get user reports error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve user reports' });
  }
});

module.exports = router;
