const express = require('express');
const { body } = require('express-validator');
const {
  createReport,
  getReports,
  getReport,
  updateReport,
  deleteReport,
  submitFeedback,
  toggleSupport,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} = require('../controllers/reportController');
const { getAdvancedAnalytics, getGeospatialSummary, getStats } = require('../controllers/analyticsController');
const { protect, optionalAuth, authorize } = require('../middleware/auth');
const { upload, processImages } = require('../middleware/upload');
const Report = require('../models/Report');

const router = express.Router();

const toOptionalBool = (value) => {
  if (value === undefined || value === '' || value === null) return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return undefined;
};

// Validation rules (toInt/toFloat support FormData string values)
const createReportValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('category')
    .isIn([
      'Pothole', 'Road Damage', 'Waste', 'Sanitation', 'Light', 'Streetlight',
      'Water', 'Drainage', 'Traffic', 'Parks', 'Noise', 'Building',
      'Public Safety', 'Other'
    ])
    .withMessage('Please select a valid category'),
  body('subcategory').optional().trim().isLength({ max: 100 }),
  body('urgencyLevel').optional().isIn(['low', 'medium', 'high', 'emergency']),
  body('contactPreference').optional().isIn(['app', 'email', 'phone', 'none']),
  body('affectedArea').optional().isIn(['individual', 'street', 'block', 'neighborhood']),
  body('landmark').optional().trim().isLength({ max: 200 }),
  body('isPublic').optional().customSanitizer(toOptionalBool),
  body('priority')
    .toInt()
    .isInt({ min: 1, max: 5 })
    .withMessage('Priority must be between 1 and 5'),
  body('longitude')
    .toFloat()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Please provide a valid longitude'),
  body('latitude')
    .toFloat()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Please provide a valid latitude'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters')
];

const updateReportValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('priority')
    .optional()
    .toInt()
    .isInt({ min: 1, max: 5 })
    .withMessage('Priority must be between 1 and 5')
];

const feedbackValidation = [
  body('rating')
    .toInt()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters')
];

const reportPopulate = [
  { path: 'citizenId', select: 'name email phone' },
  { path: 'assignedStaffId', select: 'name staffId department role' },
  { path: 'staffComments.staffId', select: 'name staffId department' },
  { path: 'statusHistory.changedBy', select: 'name role department' }
];

// --- Static routes MUST come before /:id ---

router.get('/my', protect, async (req, res, next) => {
  try {
    const reports = await Report.find({ citizenId: req.user.id })
      .sort({ createdAt: -1 })
      .populate(reportPopulate);

    res.json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (error) {
    next(error);
  }
});

router.get('/admin', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'staff' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Staff role required'
      });
    }

    const reports = await Report.find({})
      .sort({ createdAt: -1 })
      .populate(reportPopulate);

    res.json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (error) {
    next(error);
  }
});

router.get('/community', protect, async (req, res, next) => {
  try {
    const reports = await Report.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .select('title category status priority supportCount location.address createdAt updatedAt photos')
      .limit(50);

    const anonymizedReports = reports.map(report => ({
      id: report._id,
      title: report.title,
      category: report.category,
      status: report.status,
      priority: report.priority,
      supportCount: report.supportCount || 0,
      location: {
        address: report.location?.address?.replace(/\d+/g, 'XXX') || 'Location withheld',
        coordinates: null
      },
      photoUrl: report.photos?.[0]?.url,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      citizenId: 'Anonymous'
    }));

    res.json({
      success: true,
      count: anonymizedReports.length,
      reports: anonymizedReports
    });
  } catch (error) {
    next(error);
  }
});

router.get('/notifications', protect, getNotifications);
router.put('/notifications/read-all', protect, markAllNotificationsRead);
router.put('/notifications/:id/read', protect, markNotificationRead);

router.get('/analytics/advanced', protect, authorize('staff', 'admin'), getAdvancedAnalytics);
router.get('/analytics/geospatial', protect, authorize('staff', 'admin'), getGeospatialSummary);
router.get('/analytics/stats', getStats);

router.route('/')
  .get(optionalAuth, getReports)
  .post(protect, upload, processImages, createReportValidation, createReport);

router.post('/:id/feedback', protect, feedbackValidation, submitFeedback);
router.post('/:id/support', protect, toggleSupport);

router.route('/:id')
  .get(optionalAuth, getReport)
  .put(protect, updateReportValidation, updateReport)
  .delete(protect, deleteReport);

module.exports = router;
