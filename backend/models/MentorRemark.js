const mongoose = require('mongoose');

const mentorRemarkSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: {
      type: String,
      enum: ['Academic', 'Attendance', 'General', 'Improvement', 'Follow-up'],
      default: 'General',
    },
    content: { type: String, required: true, trim: true, maxlength: 1500 },
  },
  { timestamps: true }
);

mentorRemarkSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model('MentorRemark', mentorRemarkSchema);
