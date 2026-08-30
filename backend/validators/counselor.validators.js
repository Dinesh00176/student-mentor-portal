const { body } = require('express-validator');

const createCounselorValidators = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  body('maxCaseLoad').optional().isInt({ min: 1 }).withMessage('Max case load must be a positive number.'),
];

module.exports = { createCounselorValidators };
