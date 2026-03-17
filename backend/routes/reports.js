/**
 * Reports Routes
 */

const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

// Mock database (replace with real database)
const reports = [];

/**
 * GET /api/reports
 * Get all reports (admin only) or user's reports
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;

    let filteredReports = [...reports];

    // Filter by type if provided
    if (type) {
      filteredReports = filteredReports.filter(r => r.incidentType === type);
    }

    // Filter by status if provided
    if (status) {
      filteredReports = filteredReports.filter(r => r.status === status);
    }

    // If not admin, only return user's reports
    if (req.user.role !== 'admin') {
      filteredReports = filteredReports.filter(r => r.userId === req.user.id);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedReports = filteredReports.slice(startIndex, startIndex + limit);

    res.json({
      success: true,
      data: paginatedReports,
      pagination: {
        total: filteredReports.length,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(filteredReports.length / limit)
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
router.get('/:id', authenticate, (req, res) => {
  try {
    const report = reports.find(r => r.id === req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && report.userId !== req.user.id && !report.anonymous) {
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

    const { incidentType, title, description, location, anonymous = false, photos = [] } = req.body;

    // Check rate limiting (max reports per day)
    const userReportsToday = reports.filter(r =>
      r.userId === req.user.id &&
      new Date(r.submittedAt).toDateString() === new Date().toDateString()
    ).length;

    const maxReportsPerDay = parseInt(process.env.MAX_REPORTS_PER_USER || 10);
    if (userReportsToday >= maxReportsPerDay) {
      return res.status(429).json({
        success: false,
        error: `Exceeded limit of ${maxReportsPerDay} reports per day`
      });
    }

    // Create report
    const report = {
      id: `RPT-${Date.now()}`,
      userId: anonymous ? null : req.user.id,
      submittedBy: req.user.email,
      incidentType,
      title,
      description,
      location,
      anonymous,
      photos,
      status: 'submitted',
      submittedAt: new Date(),
      updates: [],
      verifications: 0
    };

    reports.push(report);

    logger.info(`Report submitted: ${report.id} by user ${req.user.id}`);

    // Trigger notifications here (would call notification service)
    // notificationService.sendAdminAlert(report);

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

    const report = reports.find(r => r.id === req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    const { status, notes } = req.body;

    // Update report
    report.status = status;
    report.updates.push({
      timestamp: new Date(),
      status,
      updatedBy: req.user.id,
      notes
    });

    logger.info(`Report ${report.id} updated to status: ${status}`);

    // Send notification to user
    // notificationService.sendReportUpdate(report, status);

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
router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const index = reports.findIndex(r => r.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    reports.splice(index, 1);
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
router.post('/:id/verify', authenticate, (req, res) => {
  try {
    const report = reports.find(r => r.id === req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    report.verifications = (report.verifications || 0) + 1;

    res.json({
      success: true,
      message: 'Report verified',
      data: { verifications: report.verifications }
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
router.get('/user/:uid', authenticate, authorize('admin'), (req, res) => {
  try {
    const userReports = reports.filter(r => r.userId === req.params.uid);

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
