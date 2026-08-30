const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/student_mentoring_system';
    await mongoose.connect(uri);
    console.log(`[DB] MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    console.error('[DB] MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
