const { validationResult } = require('express-validator');
const Report = require('../models/Report');
const User = require('../models/User');
const Notification = require('../models/Notification');
const logger = require('../config/logger');
const { deleteFile } = require('../middleware/upload');
const aiService = require('../services/aiService');

// Get io instance for real-time notifications
let io = null;
const setIO = (socketIO) => {
  io = socketIO;
};

// Emit notification helper
const emitNotification = async (userId, notificationData) => {
  try {
    const notification = await Notification.create({
      userId,
      ...notificationData
    });
    
    if (io) {
      io.to(`user_${userId}`).emit('notification', notification);
    }
    
    return notification;
  } catch (error) {
    logger.error(`Failed to emit notification: ${error.message}`);
  }
};

// @desc    Create new report
// @route   POST /api/reports
// @access  Private (Citizens)
const createReport = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, description, category, priority, longitude, latitude, address } = req.body;

    // Create report data
    const reportData = {
      title,
      description,
      category,
      priority: parseInt(priority),
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        address
      },
      citizenId: req.user.id
    };

    // Add photo information if files were uploaded
    if (req.processedFiles && req.processedFiles.length > 0) {
      reportData.photos = req.processedFiles;
    }

    // Run AI analysis on the report
    const aiAnalysis = await aiService.analyzeReport(title, description, parseInt(priority));
    reportData.aiSuggestions = {
      suggestedCategory: aiAnalysis.suggestedCategory,
      suggestedPriority: aiAnalysis.suggestedPriority,
      confidence: aiAnalysis.confidence,
      processedAt: aiAnalysis.processedAt
    };

    const report = await Report.create(reportData);

    // Populate citizen information
    await report.populate('citizenId', 'name email');

    logger.info(`New report created: ${report.reportId} by ${req.user.email} - AI confidence: ${aiAnalysis.confidence}`);

    // Notify admin users of new report
    const adminUsers = await User.find({ role: 'admin', isActive: true });
    for (const admin of adminUsers) {
      await emitNotification(admin._id, {
        type: 'report_created',
        title: 'New Report Submitted',
        message: `A new ${report.category} report "${report.title}" has been submitted and requires attention.`,
        reportId: report._id
      });
    }

    if (io) {
      io.emit('new_report_map_update', {
        id: report._id,
        category: report.category,
        priority: report.priority,
        location: report.location,
        createdAt: report.createdAt
      });
    }

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      report
    });

  } catch (error) {
    // Clean up uploaded files if report creation failed
    if (req.processedFiles) {
      req.processedFiles.forEach(file => {
        deleteFile(file.filename);
      });
    }

    logger.error(`Create report error: ${error.message}`);
    next(error);
  }
};

// @desc    Get all reports with filters
// @route   GET /api/reports
// @access  Public/Private
const getReports = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    let filter = {};

    // Category filter
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Status filter
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Priority filter
    if (req.query.priority) {
      filter.priority = parseInt(req.query.priority);
    }

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    // Location-based filter (within radius)
    if (req.query.longitude && req.query.latitude && req.query.radius) {
      const longitude = parseFloat(req.query.longitude);
      const latitude = parseFloat(req.query.latitude);
      const radius = parseInt(req.query.radius); // in meters

      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: radius
        }
      };
    }

    // User-specific filters
    if (req.user) {
      if (req.user.role === 'citizen') {
        // Citizens can only see their own reports and public reports
        if (req.query.mine === 'true') {
          filter.citizenId = req.user.id;
        } else {
          filter.isPublic = true;
        }
      } else if (req.user.role === 'staff') {
        // Staff can see all reports, optionally filter by assignment
        if (req.query.assigned === 'true') {
          filter.assignedStaffId = req.user.id;
        }
      }
    } else {
      // Public access - only public reports
      filter.isPublic = true;
    }

    // Sort options
    let sort = {};
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(':');
      sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    } else {
      sort = { createdAt: -1 }; // Default sort by newest first
    }

    // Execute query
    const reports = await Report.find(filter)
      .populate('citizenId', 'name email')
      .populate('assignedStaffId', 'name staffId department')
      .populate('staffComments.staffId', 'name staffId')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Report.countDocuments(filter);

    res.json({
      success: true,
      count: reports.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      reports
    });

  } catch (error) {
    logger.error(`Get reports error: ${error.message}`);
    next(error);
  }
};

// @desc    Get single report
// @route   GET /api/reports/:id
// @access  Public/Private
const getReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('citizenId', 'name email')
      .populate('assignedStaffId', 'name staffId department')
      .populate('staffComments.staffId', 'name staffId');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check access permissions
    if (!report.isPublic) {
      if (!req.user) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      if (req.user.role === 'citizen' && report.citizenId._id.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    res.json({
      success: true,
      report
    });

  } catch (error) {
    logger.error(`Get report error: ${error.message}`);
    next(error);
  }
};

// @desc    Update report (for citizens - limited fields)
// @route   PUT /api/reports/:id
// @access  Private (Citizens - own reports only)
const updateReport = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    let report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check if user owns this report
    if (report.citizenId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this report'
      });
    }

    // Citizens can only update if status is 'Submitted'
    if (report.status !== 'Submitted') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update report that is already being processed'
      });
    }

    // Only allow certain fields to be updated by citizens
    const allowedUpdates = ['title', 'description', 'priority'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    report = await Report.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    }).populate('citizenId', 'name email');

    logger.info(`Report updated by citizen: ${report.reportId}`);

    res.json({
      success: true,
      message: 'Report updated successfully',
      report
    });

  } catch (error) {
    logger.error(`Update report error: ${error.message}`);
    next(error);
  }
};

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Private (Citizens - own reports only, Staff - any report)
const deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check permissions
    if (req.user.role === 'citizen' && report.citizenId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this report'
      });
    }

    // Citizens can only delete if status is 'Submitted'
    if (req.user.role === 'citizen' && report.status !== 'Submitted') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete report that is already being processed'
      });
    }

    // Delete associated photos
    if (report.photos && report.photos.length > 0) {
      report.photos.forEach(photo => {
        deleteFile(photo.filename);
      });
    }

    await Report.findByIdAndDelete(req.params.id);

    logger.info(`Report deleted: ${report.reportId} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });

  } catch (error) {
    logger.error(`Delete report error: ${error.message}`);
    next(error);
  }
};

// @desc    Submit citizen feedback
// @route   POST /api/reports/:id/feedback
// @access  Private (Citizens - own reports only)
const submitFeedback = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { rating, comment } = req.body;

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check if user owns this report
    if (report.citizenId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to provide feedback on this report'
      });
    }

    // Can only provide feedback on resolved reports
    if (report.status !== 'Resolved') {
      return res.status(400).json({
        success: false,
        message: 'Feedback can only be provided on resolved reports'
      });
    }

    report.citizenFeedback = {
      rating: parseInt(rating),
      comment,
      submittedAt: new Date()
    };

    await report.save();

    logger.info(`Feedback submitted for report: ${report.reportId}`);

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      report
    });

  } catch (error) {
    logger.error(`Submit feedback error: ${error.message}`);
    next(error);
  }
};

// @desc    Toggle support (upvote) on a report
// @route   POST /api/reports/:id/support
// @access  Private (Authenticated users)
const toggleSupport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const userId = req.user.id;
    const hasSupported = report.supports.includes(userId);

    if (hasSupported) {
      // Remove support
      report.supports = report.supports.filter(id => id.toString() !== userId);
      report.supportCount = Math.max(0, report.supportCount - 1);
    } else {
      // Add support
      report.supports.push(userId);
      report.supportCount += 1;
    }

    await report.save();

    // Notify report owner if someone else supports
    if (report.citizenId.toString() !== userId) {
      const supporter = await User.findById(userId);
      await emitNotification(report.citizenId, {
        type: 'support_added',
        title: 'Your Report Received Support',
        message: `${supporter.name} supported your report "${report.title}".`,
        reportId: report._id,
        metadata: {
          supporterName: supporter.name,
          newSupportCount: report.supportCount
        }
      });
    }

    logger.info(`Support toggled for report: ${report.reportId} by ${req.user.email} - Count: ${report.supportCount}`);

    res.json({
      success: true,
      message: hasSupported ? 'Support removed' : 'Support added',
      supportCount: report.supportCount,
      hasSupported: !hasSupported
    });

  } catch (error) {
    logger.error(`Toggle support error: ${error.message}`);
    next(error);
  }
};

// @desc    Get notifications for current user
// @route   GET /api/reports/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.getRecent(req.user.id, limit);
    const unreadCount = await Notification.getUnreadCount(req.user.id);
    const total = await Notification.countDocuments({ userId: req.user.id });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page
      }
    });

  } catch (error) {
    logger.error(`Get notifications error: ${error.message}`);
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/reports/notifications/:id/read
// @access  Private
const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    logger.error(`Mark notification read error: ${error.message}`);
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/reports/notifications/read-all
// @access  Private
const markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.markAllAsRead(req.user.id);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    logger.error(`Mark all notifications read error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  createReport,
  getReports,
  getReport,
  updateReport,
  deleteReport,
  submitFeedback,
  toggleSupport,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  setIO
};