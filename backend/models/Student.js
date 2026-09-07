const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    studentCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    year: { type: Number, required: true, min: 1, max: 6 },
    semester: { type: Number, required: true, min: 1, max: 12 },
    section: { type: String, trim: true, default: 'A' },
    assignedMentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    enrollmentStatus: {
      type: String,
      enum: ['active', 'inactive', 'graduated'],
      default: 'active',
    },
  },
  { timestamps: true }
);

studentSchema.index({ department: 1 });
studentSchema.index({ assignedMentor: 1 });

module.exports = mongoose.model('Student', studentSchema);
