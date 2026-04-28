const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  type: {
    type: String,
    enum: ['report_created', 'report_updated', 'report_resolved', 'report_assigned', 'system', 'support_added'],
    required: [true, 'Notification type is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    default: null
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for user notifications query performance
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

// Mark notification as read
notificationSchema.methods.markAsRead = async function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to get unread count for a user
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ userId, read: false });
};

// Static method to get recent notifications for a user
notificationSchema.statics.getRecent = function(userId, limit = 20) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('reportId', 'reportId title status');
};

// Static method to mark all as read for a user
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { userId, read: false },
    { read: true, readAt: new Date() }
  );
};

// Transform output
notificationSchema.methods.toJSON = function() {
  const notificationObject = this.toObject();
  delete notificationObject.__v;
  return notificationObject;
};

module.exports = mongoose.model('Notification', notificationSchema);
