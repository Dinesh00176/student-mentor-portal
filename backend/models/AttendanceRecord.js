const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    subject: { type: String, required: true, trim: true },
    semester: { type: Number, required: true, min: 1, max: 12 },
    totalClasses: { type: Number, required: true, min: 0 },
    attendedClasses: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

attendanceRecordSchema.index({ student: 1, semester: 1 });

attendanceRecordSchema.pre('validate', function preValidate(next) {
  if (this.attendedClasses > this.totalClasses) {
    next(new Error('Attended classes cannot exceed total classes'));
  } else {
    next();
  }
});

attendanceRecordSchema.virtual('percentage').get(function getPercentage() {
  if (!this.totalClasses) return 0;
  return Math.round((this.attendedClasses / this.totalClasses) * 10000) / 100;
});

attendanceRecordSchema.set('toJSON', { virtuals: true });
attendanceRecordSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
