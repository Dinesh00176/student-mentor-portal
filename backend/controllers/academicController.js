const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const AcademicRecord = require('../models/AcademicRecord');
const Student = require('../models/Student');
const { assertCanAccessStudent, assertMentorOwnsStudent, assertSelf } = require('../services/ownership');
const { computeSemesterGPA, computeCGPA, computeSemesterTrend } = require('../services/gpaCalculator');

// GET /api/academic/student/:studentId?semester=
const getStudentAcademics = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { semester } = req.query;
  await assertCanAccessStudent(req.user, studentId);

  const filter = { student: studentId };
  if (semester) filter.semester = Number(semester);

  const records = await AcademicRecord.find(filter).sort({ semester: 1, subject: 1 });
  const allRecords = semester ? await AcademicRecord.find({ student: studentId }) : records;

  sendSuccess(res, 200, {
    records,
    currentSemesterGPA: computeSemesterGPA(records),
    cgpa: computeCGPA(allRecords),
    trend: computeSemesterTrend(allRecords),
  }, 'Academic records fetched.');
});

// POST /api/academic (mentor/admin)
const createAcademicRecord = asyncHandler(async (req, res) => {
  const { student, semester, subject, credits, internalMarks, examMarks, grade, gradePoint, isArrear, remarks } = req.body;
  if (!student || !semester || !subject) throw new ApiError(400, 'student, semester and subject are required.');

  await assertMentorOwnsStudent(req.user, student);

  const record = await AcademicRecord.create({
    student, semester, subject, credits, internalMarks, examMarks, grade, gradePoint, isArrear, remarks,
  });
  sendSuccess(res, 201, record, 'Academic record added.');
});

// PUT /api/academic/:id (mentor/admin)
const updateAcademicRecord = asyncHandler(async (req, res) => {
  const record = await AcademicRecord.findById(req.params.id);
  if (!record) throw new ApiError(404, 'Academic record not found.');
  await assertMentorOwnsStudent(req.user, record.student);

  Object.assign(record, req.body);
  await record.save();
  sendSuccess(res, 200, record, 'Academic record updated.');
});

// DELETE /api/academic/:id (admin only, mentor with ownership)
const deleteAcademicRecord = asyncHandler(async (req, res) => {
  const record = await AcademicRecord.findById(req.params.id);
  if (!record) throw new ApiError(404, 'Academic record not found.');
  await assertMentorOwnsStudent(req.user, record.student);

  await record.deleteOne();
  sendSuccess(res, 200, null, 'Academic record deleted.');
});

module.exports = { getStudentAcademics, createAcademicRecord, updateAcademicRecord, deleteAcademicRecord };
