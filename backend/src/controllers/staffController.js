const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Report = require('../models/Report');
const User = require('../models/User');
const logger = require('../config/logger');
const { notifyCitizenReportUpdate } = require('../services/notificationService');

const getOwnerId = (citizenId) => {
  if (!citizenId) return null;
  if (typeof citizenId === 'object' && citizenId._id) return citizenId._id.toString();
  return citizenId.toString();
};

const pushStatusHistory = (report, changedBy, toStatus, note = '') => {
  const fromStatus = report.status;
  if (fromStatus === toStatus && !note) return;

  report.statusHistory.push({
    fromStatus,
    toStatus,
    changedBy,
    note: note || undefined,
    createdAt: new Date()
  });
};

const populateReport = async (report) => {
  await report.populate([
    { path: 'citizenId', select: 'name email phone' },
    { path: 'assignedStaffId', select: 'name staffId department role' },
    { path: 'staffComments.staffId', select: 'name staffId department' },
    { path: 'statusHistory.changedBy', select: 'name role department' }
  ]);
  return report;
};

// @desc    List staff members for assignment
// @route   GET /api/staff/members
const getStaffMembers = async (req, res, next) => {
  try {
    const members = await User.find({
      role: { $in: ['staff', 'admin'] },
      isActive: true
    }).select('name email department role staffId').sort({ name: 1 });

    res.json({ success: true, members });
  } catch (error) {
    logger.error(`Get staff members error: ${error.message}`);
    next(error);
  }
};

// @desc    Assign report to staff
// @route   PUT /api/staff/reports/:id/assign
const assignReport = async (req, res, next) => {
  try {
    const { staffId } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    let assignee;
    if (staffId) {
      assignee = await User.findById(staffId);
      if (!assignee || !['staff', 'admin'].includes(assignee.role)) {
        return res.status(400).json({ success: false, message: 'Invalid staff member' });
      }
      report.assignedStaffId = staffId;
    } else {
      assignee = req.user;
      report.assignedStaffId = req.user.id;
    }

    if (report.status === 'Submitted') {
      pushStatusHistory(report, req.user.id, 'Assigned', `Assigned to ${assignee.name}`);
      report.status = 'Assigned';
      report.assignedAt = new Date();
    } else {
      pushStatusHistory(report, req.user.id, report.status, `Reassigned to ${assignee.name}`);
    }

    await report.save();
    await populateReport(report);

    await notifyCitizenReportUpdate(report, {
      type: 'report_assigned',
      title: 'Report Assigned to Official',
      message: `Your report "${report.title}" has been assigned to ${assignee.name} for review.`
    });

    logger.info(`Report ${report.reportId} assigned to ${assignee.email}`);

    res.json({ success: true, message: 'Report assigned successfully', report });
  } catch (error) {
    logger.error(`Assign report error: ${error.message}`);
    next(error);
  }
};

// @desc    Update report status
// @route   PUT /api/staff/reports/:id/status
const updateStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { status, resolutionDetails, estimatedResolutionDate, rejectionReason, statusNote } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (req.user.role === 'staff' &&
        report.assignedStaffId &&
        report.assignedStaffId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this report'
      });
    }

    if (status === 'Rejected' && !rejectionReason && !resolutionDetails) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required when rejecting a report'
      });
    }

    const previousStatus = report.status;
    const note = statusNote || resolutionDetails || rejectionReason || '';

    if (previousStatus !== status) {
      pushStatusHistory(report, req.user.id, status, note);
    }

    report.status = status;

    if (resolutionDetails) report.resolutionDetails = resolutionDetails;
    if (estimatedResolutionDate) report.estimatedResolutionDate = new Date(estimatedResolutionDate);
    if (status === 'Rejected' && rejectionReason) report.rejectionReason = rejectionReason;
    if (status === 'Resolved' || status === 'Closed') {
      report.resolvedAt = report.resolvedAt || new Date();
      report.actualResolutionDate = new Date();
    }

    await report.save();
    await populateReport(report);

    const statusMessages = {
      'In Progress': 'is now being worked on',
      Resolved: 'has been resolved',
      Closed: 'has been closed',
      Rejected: 'was reviewed and rejected',
      Assigned: 'has been assigned to a department',
      Submitted: 'status was updated'
    };

    await notifyCitizenReportUpdate(report, {
      type: status === 'Resolved' ? 'report_resolved' : 'report_updated',
      title: `Report Status: ${status}`,
      message: `Your report "${report.title}" ${statusMessages[status] || 'was updated'}.${note ? ` Note: ${note}` : ''}`
    });

    logger.info(`Report ${report.reportId} status ${previousStatus} → ${status} by ${req.user.email}`);

    res.json({ success: true, message: 'Report status updated successfully', report });
  } catch (error) {
    logger.error(`Update status error: ${error.message}`);
    next(error);
  }
};

// @desc    Update report priority
// @route   PUT /api/staff/reports/:id/priority
const updatePriority = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { priority, note } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const oldPriority = report.priority;
    report.priority = priority;

    pushStatusHistory(
      report,
      req.user.id,
      report.status,
      note || `Priority changed from P${oldPriority} to P${priority}`
    );

    await report.save();
    await populateReport(report);

    await notifyCitizenReportUpdate(report, {
      title: 'Report Priority Updated',
      message: `Priority for "${report.title}" changed to P${priority}.`
    });

    res.json({ success: true, message: 'Priority updated', report });
  } catch (error) {
    logger.error(`Update priority error: ${error.message}`);
    next(error);
  }
};

// @desc    Add staff comment
// @route   POST /api/staff/reports/:id/comment
const addComment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { comment } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.staffComments.push({
      staffId: req.user.id,
      comment,
      createdAt: new Date()
    });

    await report.save();
    await populateReport(report);

    await notifyCitizenReportUpdate(report, {
      title: 'Official Update on Your Report',
      message: `New update on "${report.title}": ${comment}`
    });

    logger.info(`Comment added to report ${report.reportId} by ${req.user.email}`);

    res.json({ success: true, message: 'Comment added successfully', report });
  } catch (error) {
    logger.error(`Add comment error: ${error.message}`);
    next(error);
  }
};

// @desc    Get staff dashboard analytics
// @route   GET /api/staff/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const staffId = req.user.id;

    const assignedFilter = isAdmin ? {} : { assignedStaffId: staffId };

    const [assignedReports, statusCounts, recentActivity, pendingCount, overdueCount] = await Promise.all([
      Report.find(assignedFilter)
        .populate('citizenId', 'name email')
        .sort({ createdAt: -1 })
        .limit(10),
      Report.aggregate([
        { $match: isAdmin ? {} : { assignedStaffId: new mongoose.Types.ObjectId(staffId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Report.find(isAdmin ? {} : {
        $or: [{ assignedStaffId: staffId }, { 'staffComments.staffId': staffId }]
      })
        .populate('citizenId', 'name')
        .sort({ updatedAt: -1 })
        .limit(8),
      Report.countDocuments({ ...assignedFilter, status: { $in: ['Submitted', 'Assigned'] } }),
      Report.countDocuments({
        ...assignedFilter,
        status: { $in: ['Submitted', 'Assigned', 'In Progress'] },
        estimatedResolutionDate: { $lt: new Date() }
      })
    ]);

    res.json({
      success: true,
      data: {
        assignedReports,
        statusCounts,
        recentActivity,
        pendingCount,
        overdueCount,
        isAdmin
      }
    });
  } catch (error) {
    logger.error(`Get dashboard error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  getStaffMembers,
  assignReport,
  updateStatus,
  updatePriority,
  addComment,
  getDashboard
};
