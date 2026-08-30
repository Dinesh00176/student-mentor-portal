const mongoose = require('mongoose');

// Simple appointment/meeting-request system: a student requests a meeting
// with their mentor (or a counselor), the recipient accepts/rejects/
// reschedules it. Deliberately synchronous/request-response - no
// websockets or real-time infrastructure, per project scope.
const appointmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    withUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // mentor or counselor
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    preferredDate: { type: Date, required: true },
    confirmedDate: { type: Date },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'Rejected'],
      default: 'Pending',
    },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

appointmentSchema.index({ withUser: 1, status: 1 });
appointmentSchema.index({ student: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
