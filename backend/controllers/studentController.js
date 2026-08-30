const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const { getPagination, buildPaginatedResponse } = require('../utils/pagination');
const Student = require('../models/Student');
const User = require('../models/User');
const { evaluateStudentAttention } = require('../services/attentionEngine');
const { getStudentRiskInputs } = require('../services/studentDataAggregator');
const { assertSelf } = require('../services/ownership');
const { logAudit } = require('../services/auditLog.service');
const { notify } = require('../services/notify.service');

// GET /api/students  (admin: all, mentor: assigned only)
const listStudents = asyncHandler(async (req, res) => {
  const { q, department, mentor, status, year, semester } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};
  if (req.user.role === 'mentor') {
    filter.assignedMentor = req.user._id;
  } else if (mentor) {
    filter.assignedMentor = mentor;
  }
  if (department) filter.department = department;
  if (status) filter.enrollmentStatus = status;
  if (year) filter.year = Number(year);
  if (semester) filter.semester = Number(semester);
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { studentCode: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    Student.find(filter)
      .populate('department', 'name code')
      .populate('assignedMentor', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Student.countDocuments(filter),
  ]);

  sendSuccess(res, 200, buildPaginatedResponse(items, total, page, limit), 'Students fetched.');
});

// GET /api/students/:id
const getStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate('department', 'name code')
    .populate('assignedMentor', 'name email phone')
    .populate('user', 'name email phone');
  if (!student) throw new ApiError(404, 'Student not found.');

  if (req.user.role === 'mentor' && String(student.assignedMentor?._id) !== String(req.user._id)) {
    throw new ApiError(403, 'You are not the assigned mentor for this student.');
  }
  if (req.user.role === 'student') {
    assertSelf(req.user, student.user?._id);
  }

  sendSuccess(res, 200, student, 'Student fetched.');
});

// POST /api/students  (admin only) - creates linked User(role=student) + Student
const createStudent = asyncHandler(async (req, res) => {
  const {
    name, email, password, phone, studentCode, department, year, semester, section, assignedMentor,
  } = req.body;

  if (!name || !email || !password || !studentCode || !department || !year || !semester) {
    throw new ApiError(400, 'name, email, password, studentCode, department, year and semester are required.');
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) throw new ApiError(409, 'A user with this email already exists.');

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, passwordHash, role: 'student', phone });

  try {
    const student = await Student.create({
      user: user._id,
      studentCode,
      department,
      year,
      semester,
      section,
      assignedMentor: assignedMentor || null,
    });
    const populated = await student.populate([
      { path: 'department', select: 'name code' },
      { path: 'assignedMentor', select: 'name email' },
    ]);
    await logAudit({
      actor: req.user, action: 'StudentCreated', targetType: 'Student', targetId: student._id,
      details: `Created student ${studentCode}`,
    });
    sendSuccess(res, 201, populated, 'Student created.');
  } catch (err) {
    // Roll back the orphaned User if Student creation failed
    await User.findByIdAndDelete(user._id);
    throw err;
  }
});

// PUT /api/students/:id (admin only)
const updateStudent = asyncHandler(async (req, res) => {
  const { name, phone, department, year, semester, section, enrollmentStatus } = req.body;
  const student = await Student.findById(req.params.id);
  if (!student) throw new ApiError(404, 'Student not found.');

  if (department) student.department = department;
  if (year) student.year = year;
  if (semester) student.semester = semester;
  if (section) student.section = section;
  if (enrollmentStatus) student.enrollmentStatus = enrollmentStatus;
  await student.save();

  if (name || phone || enrollmentStatus) {
    const accountStatus = enrollmentStatus ? (enrollmentStatus === 'active' ? 'active' : 'inactive') : undefined;
    await User.findByIdAndUpdate(student.user, {
      ...(name && { name }),
      ...(phone && { phone }),
      // Keep the linked login account in sync with enrollment status changes,
      // so reactivating a student (enrollmentStatus -> active) also restores login.
      // Both fields are set explicitly since findByIdAndUpdate bypasses the
      // pre-save sync hook on the User model.
      ...(accountStatus && { status: accountStatus, isActive: accountStatus === 'active' }),
    });
  }

  await logAudit({
    actor: req.user, action: 'StudentUpdated', targetType: 'Student', targetId: student._id,
    details: enrollmentStatus ? `enrollmentStatus -> ${enrollmentStatus}` : 'Profile fields updated',
  });

  const populated = await Student.findById(student._id)
    .populate('department', 'name code')
    .populate('assignedMentor', 'name email');
  sendSuccess(res, 200, populated, 'Student updated.');
});

// DELETE /api/students/:id (admin only) - soft delete (deactivate).
// Historical academic/attendance/counseling/intervention records are never
// removed - only the enrollment status and linked login are deactivated.
const deactivateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndUpdate(
    req.params.id,
    { enrollmentStatus: 'inactive' },
    { new: true }
  );
  if (!student) throw new ApiError(404, 'Student not found.');
  await User.findByIdAndUpdate(student.user, { status: 'inactive', isActive: false });
  await logAudit({
    actor: req.user, action: 'StudentDeactivated', targetType: 'Student', targetId: student._id,
  });
  sendSuccess(res, 200, student, 'Student deactivated.');
});

// PATCH /api/students/:id/assign-mentor (admin only)
const assignMentor = asyncHandler(async (req, res) => {
  const { mentorUserId } = req.body;
  if (!mentorUserId) throw new ApiError(400, 'mentorUserId is required.');
  const mentorUser = await User.findOne({ _id: mentorUserId, role: 'mentor' });
  if (!mentorUser) throw new ApiError(404, 'Mentor not found.');
  if (mentorUser.status !== 'active') {
    throw new ApiError(400, 'Cannot assign a student to an inactive or suspended mentor.');
  }

  const previousStudent = await Student.findById(req.params.id);
  if (!previousStudent) throw new ApiError(404, 'Student not found.');
  const previousMentorId = previousStudent.assignedMentor;

  const student = await Student.findByIdAndUpdate(
    req.params.id,
    { assignedMentor: mentorUserId },
    { new: true }
  ).populate('assignedMentor', 'name email');

  await logAudit({
    actor: req.user, action: 'MentorAssigned', targetType: 'Student', targetId: student._id,
    details: `Assigned mentor ${mentorUser.name}` + (previousMentorId ? ' (reassigned)' : ''),
  });
  await notify({
    user: mentorUserId, type: 'General', relatedStudent: student._id,
    message: `You have been assigned as mentor for ${student.studentCode}.`,
  });

  sendSuccess(res, 200, student, 'Mentor assigned.');
});

// GET /api/students/:id/attention
const getStudentAttention = asyncHandler(async (req, res) => {
  const inputs = await getStudentRiskInputs(req.params.id);
  if (!inputs) throw new ApiError(404, 'Student not found.');

  if (req.user.role === 'mentor' && String(inputs.student.assignedMentor) !== String(req.user._id)) {
    throw new ApiError(403, 'You are not the assigned mentor for this student.');
  }

  const result = evaluateStudentAttention(inputs);
  sendSuccess(res, 200, result, 'Attention status computed.');
});

module.exports = {
  listStudents,
  getStudent,
  createStudent,
  updateStudent,
  deactivateStudent,
  assignMentor,
  getStudentAttention,
};
