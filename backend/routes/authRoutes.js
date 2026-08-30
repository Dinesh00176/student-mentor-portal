const express = require('express');
const {
  login, logout, getMe, changePassword, forgotPassword, resetPassword,
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  loginValidators, changePasswordValidators, forgotPasswordValidators, resetPasswordValidators,
} = require('../validators/auth.validators');
const { loginLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/login', loginLimiter, loginValidators, validate, login);
router.post('/logout', logout);
router.get('/me', verifyToken, getMe);
router.patch('/change-password', verifyToken, changePasswordValidators, validate, changePassword);
router.post('/forgot-password', loginLimiter, forgotPasswordValidators, validate, forgotPassword);
router.post('/reset-password', resetPasswordValidators, validate, resetPassword);

module.exports = router;
