const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const MentorRemark = require('../models/MentorRemark');
const Student = require('../models/Student');
const { assertMentorOwnsStudent, assertSelf } = require('../services/ownership');

// GET /api/remarks/student/:studentId
const getStudentRemarks = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const student = await Student.findById(studentId).populate('user', '_id');
  if (!student) throw new ApiError(404, 'Student not found.');

  if (req.user.role === 'mentor') await assertMentorOwnsStudent(req.user, studentId);
  if (req.user.role === 'student') assertSelf(req.user, student.user?._id);
  if (req.user.role === 'counselor') throw new ApiError(403, 'Counselors do not have access to mentor remarks.');

  const remarks = await MentorRemark.find({ student: studentId })
    .populate('mentor', 'name')
    .sort({ createdAt: -1 });
  sendSuccess(res, 200, remarks, 'Mentor remarks fetched.');
});

// POST /api/remarks (mentor only)
const createRemark = asyncHandler(async (req, res) => {
  const { student, category, content } = req.body;
  if (!student || !content) throw new ApiError(400, 'student and content are required.');
  await assertMentorOwnsStudent(req.user, student);

  const remark = await MentorRemark.create({ student, mentor: req.user._id, category, content });
  const populated = await remark.populate('mentor', 'name');
  sendSuccess(res, 201, populated, 'Remark added.');
});

// PUT /api/remarks/:id (author mentor only)
const updateRemark = asyncHandler(async (req, res) => {
  const remark = await MentorRemark.findById(req.params.id);
  if (!remark) throw new ApiError(404, 'Remark not found.');
  if (req.user.role !== 'admin' && String(remark.mentor) !== String(req.user._id)) {
    throw new ApiError(403, 'You may only edit your own remarks.');
  }
  const { category, content } = req.body;
  if (category) remark.category = category;
  if (content) remark.content = content;
  await remark.save();
  sendSuccess(res, 200, remark, 'Remark updated.');
});

module.exports = { getStudentRemarks, createRemark, updateRemark };
