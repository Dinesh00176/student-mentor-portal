const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    relatedTo: {
      type: { type: String, enum: ['Counseling', 'Intervention', 'General'], default: 'General' },
      refId: { type: mongoose.Schema.Types.ObjectId, refPath: 'relatedTo.type' },
    },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ['Pending', 'Completed', 'Overdue'], default: 'Pending' },
    outcome: { type: String, trim: true, maxlength: 1000 },
    notes: { type: String, trim: true, maxlength: 500 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

followUpSchema.index({ status: 1, dueDate: 1 });
followUpSchema.index({ student: 1 });
followUpSchema.index({ student: 1, status: 1 });

module.exports = mongoose.model('FollowUp', followUpSchema);
