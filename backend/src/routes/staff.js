const express = require('express');
const { body } = require('express-validator');
const {
  getStaffMembers,
  assignReport,
  updateStatus,
  updatePriority,
  addComment,
  getDashboard
} = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('staff', 'admin'));

const statusValidation = [
  body('status')
    .isIn(['Submitted', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Rejected'])
    .withMessage('Please provide a valid status'),
  body('resolutionDetails')
    .optional()
    .trim()
    .isLength({ max: 1000 }),
  body('rejectionReason')
    .optional()
    .trim()
    .isLength({ max: 1000 }),
  body('statusNote')
    .optional()
    .trim()
    .isLength({ max: 1000 }),
  body('estimatedResolutionDate')
    .optional()
    .isISO8601()
    .toDate()
];

const priorityValidation = [
  body('priority')
    .toInt()
    .isInt({ min: 1, max: 5 }),
  body('note').optional().trim().isLength({ max: 500 })
];

const commentValidation = [
  body('comment')
    .trim()
    .isLength({ min: 1, max: 1000 })
];

router.get('/members', getStaffMembers);
router.get('/dashboard', getDashboard);
router.put('/reports/:id/assign', assignReport);
router.put('/reports/:id/status', statusValidation, updateStatus);
router.put('/reports/:id/priority', priorityValidation, updatePriority);
router.post('/reports/:id/comment', commentValidation, addComment);

module.exports = router;
