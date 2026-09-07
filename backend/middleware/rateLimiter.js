const rateLimit = require('express-rate-limit');

// Basic brute-force protection on login/password-reset endpoints. Kept
// simple and in-memory (no Redis) to avoid introducing new infrastructure -
// acceptable for a single-instance deployment of this project.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts from this device. Please wait a few minutes and try again.',
    errors: [],
  },
});

module.exports = { loginLimiter };
