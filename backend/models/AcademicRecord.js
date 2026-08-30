const mongoose = require('mongoose');

const academicRecordSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    semester: { type: Number, required: true, min: 1, max: 12 },
    subject: { type: String, required: true, trim: true },
    credits: { type: Number, required: true, min: 1, max: 10, default: 3 },
    internalMarks: { type: Number, min: 0, max: 100 },
    examMarks: { type: Number, min: 0, max: 100 },
    grade: { type: String, trim: true, uppercase: true },
    gradePoint: { type: Number, min: 0, max: 10 },
    isArrear: { type: Boolean, default: false },
    remarks: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

academicRecordSchema.index({ student: 1, semester: 1 });

module.exports = mongoose.model('AcademicRecord', academicRecordSchema);
