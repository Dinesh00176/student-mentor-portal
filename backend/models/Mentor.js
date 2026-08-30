const mongoose = require('mongoose');

const mentorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    designation: { type: String, trim: true, default: 'Faculty Mentor' },
    maxStudentLoad: { type: Number, default: 25, min: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Mentor', mentorSchema);
