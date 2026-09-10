const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const AttendanceRecord = require('../models/AttendanceRecord');
const Student = require('../models/Student');
const { assertCanAccessStudent, assertMentorOwnsStudent, assertSelf } = require('../services/ownership');
const { summarizeAttendance } = require('../services/attendanceCalculator');

// GET /api/attendance/student/:studentId?semester=
const getStudentAttendance = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { semester } = req.query;
  await assertCanAccessStudent(req.user, studentId);

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
  if (Number(totalClasses) < 0 || Number(attendedClasses) < 0) {
    throw new ApiError(400, 'Class numbers must be non-negative.');
  }
  if (Number(attendedClasses) > Number(totalClasses)) {
    throw new ApiError(400, 'Attended classes cannot exceed total classes.');
  }
  await assertMentorOwnsStudent(req.user, student);

  // Duplicate check: student + semester + subject
  const existing = await AttendanceRecord.findOne({
    student,
    semester: Number(semester),
    subject: { $regex: new RegExp(`^${subject.trim()}$`, 'i') },
  });
  if (existing) {
    throw new ApiError(409, `An attendance record for "${subject.trim()}" in Semester ${semester} already exists. Please edit the existing record.`);
  }

  const record = await AttendanceRecord.create({
    student,
    subject: subject.trim(),
    semester: Number(semester),
    totalClasses: Number(totalClasses),
    attendedClasses: Number(attendedClasses),
  });
  sendSuccess(res, 201, record, 'Attendance record added.');
});

// PUT /api/attendance/:id (mentor/admin)
const updateAttendanceRecord = asyncHandler(async (req, res) => {
  const record = await AttendanceRecord.findById(req.params.id);
  if (!record) throw new ApiError(404, 'Attendance record not found.');
  await assertMentorOwnsStudent(req.user, record.student);

  const { subject, semester, totalClasses, attendedClasses } = req.body;
  const newTotal = totalClasses !== undefined ? Number(totalClasses) : record.totalClasses;
  const newAttended = attendedClasses !== undefined ? Number(attendedClasses) : record.attendedClasses;

  if (newTotal < 0 || newAttended < 0) {
    throw new ApiError(400, 'Class numbers must be non-negative.');
  }
  if (newAttended > newTotal) {
    throw new ApiError(400, 'Attended classes cannot exceed total classes.');
  }

  if (subject) record.subject = subject.trim();
  if (semester !== undefined) record.semester = Number(semester);
  record.totalClasses = newTotal;
  record.attendedClasses = newAttended;

  await record.save();
  sendSuccess(res, 200, record, 'Attendance record updated.');
});

// DELETE /api/attendance/:id (mentor/admin)
const deleteAttendanceRecord = asyncHandler(async (req, res) => {
  const record = await AttendanceRecord.findById(req.params.id);
  if (!record) throw new ApiError(404, 'Attendance record not found.');
  await assertMentorOwnsStudent(req.user, record.student);

  await record.deleteOne();
  sendSuccess(res, 200, null, 'Attendance record deleted.');
});

module.exports = { getStudentAttendance, createAttendanceRecord, updateAttendanceRecord, deleteAttendanceRecord };
