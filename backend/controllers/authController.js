const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const User = require('../models/User');
const Student = require('../models/Student');
const { logAudit } = require('../services/auditLog.service');

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
}

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    isActive: user.isActive,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
  };
}

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required.');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
  if (!user || user.status !== 'active') {
    // Same generic message whether the account doesn't exist or is
    // inactive/suspended, so login can't be used to enumerate accounts.
    throw new ApiError(401, 'Invalid email or password.');
  }

  const match = await user.comparePassword(password);
  if (!match) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken(user);

  let profileId = null;
  if (user.role === 'student') {
    const student = await Student.findOne({ user: user._id });
    profileId = student ? student._id : null;
  }

  sendSuccess(res, 200, { token, user: sanitizeUser(user), profileId }, 'Logged in successfully.');
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  // Stateless JWT: logout is a client-side token discard. Endpoint kept for a
  // consistent API contract and to support a future cookie-based session.
  res.clearCookie('token');
  sendSuccess(res, 200, null, 'Logged out successfully.');
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  let profileId = null;
  if (req.user.role === 'student') {
    const student = await Student.findOne({ user: req.user._id });
    profileId = student ? student._id : null;
  }
  sendSuccess(res, 200, { user: sanitizeUser(req.user), profileId }, 'Current user fetched.');
});

// PATCH /api/auth/change-password (authenticated)
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'currentPassword and newPassword are required.');
  }
  if (newPassword.length < 8) {
    throw new ApiError(400, 'New password must be at least 8 characters long.');
  }

  const user = await User.findById(req.user._id).select('+passwordHash');
  const match = await user.comparePassword(currentPassword);
  if (!match) {
    throw new ApiError(401, 'Current password is incorrect.');
  }

  user.passwordHash = await User.hashPassword(newPassword);
  user.mustChangePassword = false;
  await user.save();
  await logAudit({ actor: req.user, action: 'PasswordChanged', targetType: 'User', targetId: user._id });

  sendSuccess(res, 200, null, 'Password changed successfully.');
});

// POST /api/auth/forgot-password
// NOTE: This project has no configured email service. In development the
// reset token is returned directly in the API response so the flow can be
// exercised end-to-end; in production this must be swapped for emailing the
// token/link and NOT returning it in the response body.
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, 'Email is required.');

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  // Always respond the same way whether or not the account exists, to avoid
  // leaking which emails are registered.
  const genericMessage = 'If an account with that email exists, a password reset link has been generated.';

  if (!user || user.status !== 'active') {
    return sendSuccess(res, 200, null, genericMessage);
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  await user.save();

  const devPayload = process.env.NODE_ENV !== 'production' ? { resetToken: rawToken } : null;
  sendSuccess(res, 200, devPayload, genericMessage);
});

// POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) throw new ApiError(400, 'token and newPassword are required.');
  if (newPassword.length < 8) throw new ApiError(400, 'New password must be at least 8 characters long.');

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetTokenHash +passwordResetExpires');

  if (!user) throw new ApiError(400, 'This reset link is invalid or has expired.');

  user.passwordHash = await User.hashPassword(newPassword);
  user.mustChangePassword = false;
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  sendSuccess(res, 200, null, 'Password has been reset. You can now log in.');
});

module.exports = { login, logout, getMe, changePassword, forgotPassword, resetPassword };
