const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const Counselor = require('../models/Counselor');
const User = require('../models/User');
const { logAudit } = require('../services/auditLog.service');

// GET /api/counselors?q=&status=
const listCounselors = asyncHandler(async (req, res) => {
  const { q, status } = req.query;
  let counselors = await Counselor.find().populate('user', 'name email phone isActive status').sort({ createdAt: -1 });

  if (q) {
    const needle = q.toLowerCase();
    counselors = counselors.filter(
      (c) => c.user?.name?.toLowerCase().includes(needle) || c.user?.email?.toLowerCase().includes(needle)
    );
  }
  if (status) {
    counselors = counselors.filter((c) => c.user?.status === status);
  }

  sendSuccess(res, 200, counselors, 'Counselors fetched.');
});

const createCounselor = asyncHandler(async (req, res) => {
  const { name, email, password, phone, specialization, maxCaseLoad } = req.body;
  if (!name || !email || !password) throw new ApiError(400, 'name, email and password are required.');

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) throw new ApiError(409, 'A user with this email already exists.');

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, passwordHash, role: 'counselor', phone });

  try {
    const counselor = await Counselor.create({ user: user._id, specialization, maxCaseLoad });
    const populated = await counselor.populate({ path: 'user', select: 'name email phone' });
    await logAudit({
      actor: req.user, action: 'CounselorCreated', targetType: 'Counselor', targetId: counselor._id, details: `Created counselor ${name}`,
    });
    sendSuccess(res, 201, populated, 'Counselor created.');
  } catch (err) {
    await User.findByIdAndDelete(user._id);
    throw err;
  }
});

const updateCounselor = asyncHandler(async (req, res) => {
  const { name, phone, specialization, maxCaseLoad } = req.body;
  const counselor = await Counselor.findById(req.params.id);
  if (!counselor) throw new ApiError(404, 'Counselor not found.');

  if (specialization) counselor.specialization = specialization;
  if (maxCaseLoad) counselor.maxCaseLoad = maxCaseLoad;
  await counselor.save();

  if (name || phone) {
    await User.findByIdAndUpdate(counselor.user, {
      ...(name && { name }),
      ...(phone && { phone }),
    });
  }

  await logAudit({ actor: req.user, action: 'CounselorUpdated', targetType: 'Counselor', targetId: counselor._id });

  const populated = await Counselor.findById(counselor._id).populate('user', 'name email phone isActive status');
  sendSuccess(res, 200, populated, 'Counselor updated.');
});

// PATCH /api/counselors/:id/status (admin only) - active / inactive / suspended
const updateCounselorStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['active', 'inactive', 'suspended'];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, `status must be one of: ${validStatuses.join(', ')}`);
  }
  const counselor = await Counselor.findById(req.params.id);
  if (!counselor) throw new ApiError(404, 'Counselor not found.');

  await User.findByIdAndUpdate(counselor.user, { status, isActive: status === 'active' });
  await logAudit({
    actor: req.user, action: 'CounselorStatusChanged', targetType: 'Counselor', targetId: counselor._id, details: `status -> ${status}`,
  });

  const populated = await Counselor.findById(counselor._id).populate('user', 'name email phone isActive status');
  sendSuccess(res, 200, populated, `Counselor marked ${status}.`);
});

const deactivateCounselor = asyncHandler(async (req, res) => {
  const counselor = await Counselor.findById(req.params.id);
  if (!counselor) throw new ApiError(404, 'Counselor not found.');
  await User.findByIdAndUpdate(counselor.user, { status: 'inactive', isActive: false });
  await logAudit({ actor: req.user, action: 'CounselorDeactivated', targetType: 'Counselor', targetId: counselor._id });
  sendSuccess(res, 200, null, 'Counselor deactivated.');
});

module.exports = { listCounselors, createCounselor, updateCounselor, updateCounselorStatus, deactivateCounselor };
