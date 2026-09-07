const { body } = require('express-validator');

const createStudentValidators = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  body('studentCode').trim().notEmpty().withMessage('Student ID is required.'),
  body('department').isMongoId().withMessage('A valid department is required.'),
  body('year').isInt({ min: 1, max: 6 }).withMessage('Year must be between 1 and 6.'),
  body('semester').isInt({ min: 1, max: 12 }).withMessage('Semester must be between 1 and 12.'),
  body('phone').optional({ checkFalsy: true }).isMobilePhone('any').withMessage('Phone number is invalid.'),
];

module.exports = { createStudentValidators };
