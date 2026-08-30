const mongoose = require('mongoose');

const counselingSessionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    conductedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true, default: Date.now },
    sessionType: {
      type: String,
      enum: ['Academic', 'Personal', 'Career', 'Behavioral', 'General'],
      default: 'General',
    },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    discussionSummary: { type: String, trim: true, maxlength: 2000 },
    actionItems: [{ type: String, trim: true }],
    followUpDate: { type: Date },
    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Follow-up Required', 'Closed'],
      default: 'Scheduled',
    },
    outcome: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

counselingSessionSchema.index({ student: 1, date: -1 });
counselingSessionSchema.index({ status: 1 });

module.exports = mongoose.model('CounselingSession', counselingSessionSchema);
