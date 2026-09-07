const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const AttendanceRecord = require('../models/AttendanceRecord');
const Student = require('../models/Student');
const { assertMentorOwnsStudent, assertSelf } = require('../services/ownership');
const { summarizeAttendance } = require('../services/attendanceCalculator');

// GET /api/attendance/student/:studentId?semester=
const getStudentAttendance = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { semester } = req.query;
  const student = await Student.findById(studentId).populate('user', '_id');
  if (!student) throw new ApiError(404, 'Student not found.');

  if (req.user.role === 'mentor') await assertMentorOwnsStudent(req.user, studentId);
  if (req.user.role === 'student') assertSelf(req.user, student.user?._id);

  const filter = { student: studentId };
  if (semester) filter.semester = Number(semester);

  const records = await AttendanceRecord.find(filter).sort({ subject: 1 });
  const summary = summarizeAttendance(records);

  sendSuccess(res, 200, { records, summary }, 'Attendance records fetched.');
});

// POST /api/attendance (mentor/admin)
const createAttendanceRecord = asyncHandler(async (req, res) => {
  const { student, subject, semester, totalClasses, attendedClasses } = req.body;
  if (!student || !subject || !semester || totalClasses === undefined || attendedClasses === undefined) {
    throw new ApiError(400, 'student, subject, semester, totalClasses and attendedClasses are required.');
  }
  await assertMentorOwnsStudent(req.user, student);

  const record = await AttendanceRecord.create({ student, subject, semester, totalClasses, attendedClasses });
  sendSuccess(res, 201, record, 'Attendance record added.');
});

// PUT /api/attendance/:id (mentor/admin)
const updateAttendanceRecord = asyncHandler(async (req, res) => {
  const record = await AttendanceRecord.findById(req.params.id);
  if (!record) throw new ApiError(404, 'Attendance record not found.');
  await assertMentorOwnsStudent(req.user, record.student);

  Object.assign(record, req.body);
  await record.save();
  sendSuccess(res, 200, record, 'Attendance record updated.');
});

module.exports = { getStudentAttendance, createAttendanceRecord, updateAttendanceRecord };
