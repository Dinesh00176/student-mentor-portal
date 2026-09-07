const { body } = require('express-validator');

const loginValidators = [
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

const changePasswordValidators = [
  body('currentPassword').notEmpty().withMessage('Current password is required.'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters.'),
];

const forgotPasswordValidators = [
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
];

const resetPasswordValidators = [
  body('token').notEmpty().withMessage('Reset token is required.'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters.'),
];

module.exports = { loginValidators, changePasswordValidators, forgotPasswordValidators, resetPasswordValidators };
