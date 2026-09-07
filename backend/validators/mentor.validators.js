const { body } = require('express-validator');

const createMentorValidators = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  body('department').isMongoId().withMessage('A valid department is required.'),
  body('maxStudentLoad').optional().isInt({ min: 1 }).withMessage('Max student load must be a positive number.'),
];

module.exports = { createMentorValidators };
