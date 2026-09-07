const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const Mentor = require('../models/Mentor');
const User = require('../models/User');
const Student = require('../models/Student');
const { logAudit } = require('../services/auditLog.service');

// GET /api/mentors?q=&status=&department=
const listMentors = asyncHandler(async (req, res) => {
  const { q, status, department } = req.query;
  const filter = {};
  if (department) filter.department = department;

  let mentors = await Mentor.find(filter)
    .populate('user', 'name email phone isActive status')
    .populate('department', 'name code')
    .sort({ createdAt: -1 });

  if (q) {
    const needle = q.toLowerCase();
    mentors = mentors.filter(
      (m) => m.user?.name?.toLowerCase().includes(needle) || m.user?.email?.toLowerCase().includes(needle)
    );
  }
  if (status) {
    mentors = mentors.filter((m) => m.user?.status === status);
  }

  // attach live workload counts
  const withLoad = await Promise.all(
    mentors.map(async (m) => {
      const count = await Student.countDocuments({ assignedMentor: m.user?._id, enrollmentStatus: 'active' });
      return { ...m.toObject(), currentStudentLoad: count };
    })
  );

  sendSuccess(res, 200, withLoad, 'Mentors fetched.');
});

// GET /api/mentors/:id
const getMentor = asyncHandler(async (req, res) => {
  const mentor = await Mentor.findById(req.params.id)
    .populate('user', 'name email phone isActive')
    .populate('department', 'name code');
  if (!mentor) throw new ApiError(404, 'Mentor not found.');
  sendSuccess(res, 200, mentor, 'Mentor fetched.');
});

// POST /api/mentors (admin only)
const createMentor = asyncHandler(async (req, res) => {
  const { name, email, password, phone, department, designation, maxStudentLoad } = req.body;
  if (!name || !email || !password || !department) {
    throw new ApiError(400, 'name, email, password and department are required.');
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) throw new ApiError(409, 'A user with this email already exists.');

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, passwordHash, role: 'mentor', phone });

  try {
    const mentor = await Mentor.create({ user: user._id, department, designation, maxStudentLoad });
    const populated = await mentor.populate([
      { path: 'user', select: 'name email phone' },
      { path: 'department', select: 'name code' },
    ]);
    await logAudit({
      actor: req.user, action: 'MentorCreated', targetType: 'Mentor', targetId: mentor._id, details: `Created mentor ${name}`,
    });
    sendSuccess(res, 201, populated, 'Mentor created.');
  } catch (err) {
    await User.findByIdAndDelete(user._id);
    throw err;
  }
});

// PUT /api/mentors/:id (admin only)
const updateMentor = asyncHandler(async (req, res) => {
  const { name, phone, department, designation, maxStudentLoad } = req.body;
  const mentor = await Mentor.findById(req.params.id);
  if (!mentor) throw new ApiError(404, 'Mentor not found.');

  if (department) mentor.department = department;
  if (designation) mentor.designation = designation;
  if (maxStudentLoad) mentor.maxStudentLoad = maxStudentLoad;
  await mentor.save();

  if (name || phone) {
    await User.findByIdAndUpdate(mentor.user, {
      ...(name && { name }),
      ...(phone && { phone }),
    });
  }

  await logAudit({ actor: req.user, action: 'MentorUpdated', targetType: 'Mentor', targetId: mentor._id });

  const populated = await Mentor.findById(mentor._id)
    .populate('user', 'name email phone isActive status')
    .populate('department', 'name code');
  sendSuccess(res, 200, populated, 'Mentor updated.');
});

// PATCH /api/mentors/:id/status (admin only) - active / inactive / suspended
const updateMentorStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['active', 'inactive', 'suspended'];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, `status must be one of: ${validStatuses.join(', ')}`);
  }
  const mentor = await Mentor.findById(req.params.id);
  if (!mentor) throw new ApiError(404, 'Mentor not found.');

  await User.findByIdAndUpdate(mentor.user, { status, isActive: status === 'active' });
  await logAudit({
    actor: req.user, action: 'MentorStatusChanged', targetType: 'Mentor', targetId: mentor._id, details: `status -> ${status}`,
  });

  const populated = await Mentor.findById(mentor._id).populate('user', 'name email phone isActive status');
  sendSuccess(res, 200, populated, `Mentor marked ${status}.`);
});

// DELETE /api/mentors/:id (admin only) - deactivate, do not hard delete (preserves history)
const deactivateMentor = asyncHandler(async (req, res) => {
  const mentor = await Mentor.findById(req.params.id);
  if (!mentor) throw new ApiError(404, 'Mentor not found.');
  await User.findByIdAndUpdate(mentor.user, { status: 'inactive', isActive: false });
  await logAudit({ actor: req.user, action: 'MentorDeactivated', targetType: 'Mentor', targetId: mentor._id });
  sendSuccess(res, 200, null, 'Mentor deactivated.');
});

module.exports = { listMentors, getMentor, createMentor, updateMentor, updateMentorStatus, deactivateMentor };
