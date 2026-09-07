const mongoose = require('mongoose');

const historyEntrySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    note: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false }
);

const interventionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    problemIdentified: { type: String, required: true, trim: true, maxlength: 1000 },
    interventionType: {
      type: String,
      enum: ['Academic Support', 'Attendance Support', 'Counseling Referral', 'Peer Support', 'Parental Involvement', 'Other'],
      default: 'Other',
    },
    actionTaken: { type: String, trim: true, maxlength: 1000 },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    followUpDate: { type: Date },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Follow-up', 'Resolved', 'Closed'],
      default: 'Open',
    },
    outcome: { type: String, trim: true, maxlength: 1000 },
    notes: { type: String, trim: true, maxlength: 1500 },
    history: [historyEntrySchema],
  },
  { timestamps: true }
);

interventionSchema.index({ student: 1, status: 1 });

module.exports = mongoose.model('Intervention', interventionSchema);
