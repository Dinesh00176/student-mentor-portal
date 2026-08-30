const ApiError = require('../utils/ApiError');

// requireRole('admin', 'mentor') -> only those roles may proceed
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Not authenticated.'));
  }
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to perform this action.'));
  }
  next();
};

module.exports = { requireRole };
