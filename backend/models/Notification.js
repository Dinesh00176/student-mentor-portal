const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['LowAttendance', 'FollowUpDue', 'InterventionOverdue', 'AcademicConcern', 'CounselingUpcoming', 'General'],
      default: 'General',
    },
    message: { type: String, required: true, trim: true, maxlength: 300 },
    relatedStudent: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
