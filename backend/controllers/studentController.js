const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const { getPagination, buildPaginatedResponse } = require('../utils/pagination');
const Student = require('../models/Student');
const User = require('../models/User');
const Mentor = require('../models/Mentor');
const Department = require('../models/Department');
const { evaluateStudentAttention } = require('../services/attentionEngine');
const { getStudentRiskInputs } = require('../services/studentDataAggregator');
const { assertCanAccessStudent, assertSelf } = require('../services/ownership');
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
    const matchingUsers = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
    }).select('_id');
    const userIds = matchingUsers.map((u) => u._id);
    filter.$or = [
      { studentCode: { $regex: q, $options: 'i' } },
      { user: { $in: userIds } },
    ];
  }

  const [items, total] = await Promise.all([
    Student.find(filter)
      .populate('user', 'name email')
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
  await assertCanAccessStudent(req.user, req.params.id);
  const student = await Student.findById(req.params.id)
    .populate('department', 'name code')
    .populate('assignedMentor', 'name email phone')
    .populate('user', 'name email phone');
  if (!student) throw new ApiError(404, 'Student not found.');

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
  const { mentorUserId, overrideCapacity } = req.body;
  if (!mentorUserId) throw new ApiError(400, 'mentorUserId is required.');
  const mentorUser = await User.findOne({ _id: mentorUserId, role: 'mentor' });
  if (!mentorUser) throw new ApiError(404, 'Mentor not found.');
  if (mentorUser.status !== 'active') {
    throw new ApiError(400, 'Cannot assign a student to an inactive or suspended mentor.');
  }

  // Capacity check
  const mentorProfile = await Mentor.findOne({ user: mentorUserId });
  if (mentorProfile) {
    const currentMentees = await Student.countDocuments({
      assignedMentor: mentorUserId,
      enrollmentStatus: 'active',
      _id: { $ne: req.params.id },
    });
    if (currentMentees >= mentorProfile.maxStudentLoad && !overrideCapacity) {
      throw new ApiError(
        400,
        `Mentor is at full capacity (${currentMentees}/${mentorProfile.maxStudentLoad}). Enable override to proceed.`
      );
    }
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
    details: `Assigned mentor ${mentorUser.name}` + (previousMentorId ? ' (reassigned)' : '') + (overrideCapacity ? ' [Capacity Override]' : ''),
  });
  await notify({
    user: mentorUserId, type: 'General', relatedStudent: student._id,
    message: `You have been assigned as mentor for ${student.studentCode}.`,
  });

  sendSuccess(res, 200, student, 'Mentor assigned.');
});

// POST /api/students/bulk-import (admin only)
const bulkImportStudents = asyncHandler(async (req, res) => {
  const rawList = Array.isArray(req.body) ? req.body : req.body.students;
  if (!Array.isArray(rawList) || rawList.length === 0) {
    throw new ApiError(400, 'An array of student records is required under "students".');
  }

  if (rawList.length > 500) {
    throw new ApiError(400, 'Maximum 500 students can be imported in a single batch.');
  }

  const allDepartments = await Department.find().select('_id name code');
  const allMentors = await Mentor.find().populate('user', '_id name email');

  const successful = [];
  const failed = [];

  for (let idx = 0; idx < rawList.length; idx += 1) {
    const row = rawList[idx];
    const rowNum = idx + 1;
    const name = (row.name || '').trim();
    const email = (row.email || '').toLowerCase().trim();
    const studentCode = (row.studentCode || '').trim().toUpperCase();
    const deptInput = (row.department || '').trim();
    const year = Number(row.year);
    const semester = Number(row.semester);
    const section = (row.section || 'A').trim().toUpperCase();
    const phone = (row.phone || '').trim();
    const password = row.password || row.defaultPassword || `${studentCode || 'Student'}@123`;

    if (!name || !email || !studentCode || !deptInput || !year || !semester) {
      failed.push({
        row: rowNum,
        studentCode: studentCode || 'N/A',
        email: email || 'N/A',
        reason: 'Missing required fields (name, email, studentCode, department, year, semester).',
      });
      continue;
    }

    const dept = allDepartments.find(
      (d) =>
        String(d._id) === deptInput ||
        d.code.toLowerCase() === deptInput.toLowerCase() ||
        d.name.toLowerCase() === deptInput.toLowerCase()
    );
    if (!dept) {
      failed.push({ row: rowNum, studentCode, email, reason: `Department '${deptInput}' not found.` });
      continue;
    }

    let mentorUserId = null;
    if (row.assignedMentor) {
      const mentorInput = String(row.assignedMentor).trim();
      const m = allMentors.find(
        (men) =>
          String(men._id) === mentorInput ||
          String(men.user?._id) === mentorInput ||
          men.user?.email?.toLowerCase() === mentorInput.toLowerCase() ||
          men.user?.name?.toLowerCase() === mentorInput.toLowerCase()
      );
      if (m) mentorUserId = m.user?._id;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      failed.push({ row: rowNum, studentCode, email, reason: `Email '${email}' is already registered.` });
      continue;
    }

    const existingStudent = await Student.findOne({ studentCode });
    if (existingStudent) {
      failed.push({ row: rowNum, studentCode, email, reason: `Student Code '${studentCode}' already exists.` });
      continue;
    }

    try {
      const passwordHash = await User.hashPassword(password);
      const user = await User.create({
        name,
        email,
        passwordHash,
        role: 'student',
        phone,
      });

      const student = await Student.create({
        user: user._id,
        studentCode,
        department: dept._id,
        year,
        semester,
        section,
        assignedMentor: mentorUserId,
      });

      successful.push({
        _id: student._id,
        studentCode,
        name,
        email,
        department: dept.code,
        year,
        semester,
      });
    } catch (err) {
      failed.push({ row: rowNum, studentCode, email, reason: err.message });
    }
  }

  if (successful.length > 0) {
    await logAudit({
      actor: req.user,
      action: 'BulkStudentsImported',
      targetType: 'Student',
      details: `Bulk imported ${successful.length} students (${failed.length} failed) via batch processing`,
    });
  }

  sendSuccess(res, 200, {
    total: rawList.length,
    importedCount: successful.length,
    failedCount: failed.length,
    successful,
    failed,
  }, `Bulk import processed: ${successful.length} created, ${failed.length} failed.`);
});

// GET /api/students/:id/attention
const getStudentAttention = asyncHandler(async (req, res) => {
  await assertCanAccessStudent(req.user, req.params.id);
  const inputs = await getStudentRiskInputs(req.params.id);
  if (!inputs) throw new ApiError(404, 'Student not found.');

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
  bulkImportStudents,
  getStudentAttention,
};
