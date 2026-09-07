const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const Notification = require('../models/Notification');

const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .populate('relatedStudent', 'studentCode')
    .sort({ createdAt: -1 })
    .limit(50);
  sendSuccess(res, 200, notifications, 'Notifications fetched.');
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) throw new ApiError(404, 'Notification not found.');
  sendSuccess(res, 200, notification, 'Notification marked as read.');
});

module.exports = { listNotifications, markNotificationRead };
