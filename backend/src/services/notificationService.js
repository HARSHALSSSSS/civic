const Notification = require('../models/Notification');
const logger = require('../config/logger');

let io = null;

const setIO = (socketIO) => {
  io = socketIO;
};

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

const notifyCitizenReportUpdate = async (report, { title, message, type = 'report_updated' }) => {
  const citizenId = report.citizenId?._id || report.citizenId;
  if (!citizenId) return;

  await emitNotification(citizenId, {
    type,
    title,
    message,
    reportId: report._id,
    metadata: {
      reportId: report.reportId,
      status: report.status,
      category: report.category
    }
  });
};

module.exports = {
  setIO,
  emitNotification,
  notifyCitizenReportUpdate
};
