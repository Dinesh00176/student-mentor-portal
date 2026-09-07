const mongoose = require('mongoose');

const counselorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    specialization: { type: String, trim: true, default: 'General Counseling' },
    maxCaseLoad: { type: Number, default: 40, min: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Counselor', counselorSchema);
