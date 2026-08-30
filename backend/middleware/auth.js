const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

// Verifies the JWT (from Authorization header OR httpOnly cookie) and attaches req.user
const verifyToken = asyncHandler(async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    throw new ApiError(401, 'Not authenticated. Please log in.');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired session. Please log in again.');
  }

  const user = await User.findById(decoded.id);
  // status is the source of truth (active/inactive/suspended); isActive is
  // kept in sync for display purposes but status is what gates access here,
  // so a suspension or deactivation takes effect immediately even for
  // already-issued tokens.
  if (!user || user.status !== 'active') {
    throw new ApiError(401, 'Account not found, deactivated, or suspended.');
  }

  req.user = user;
  next();
});

module.exports = { verifyToken };
