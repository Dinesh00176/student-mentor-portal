const { body } = require('express-validator');

const createAttendanceValidators = [
  body('student').isMongoId().withMessage('A valid student is required.'),
  body('subject').trim().notEmpty().withMessage('Subject is required.'),
  body('semester').isInt({ min: 1, max: 12 }).withMessage('Semester must be between 1 and 12.'),
  body('totalClasses').isInt({ min: 0 }).withMessage('Total classes must be a non-negative number.'),
  body('attendedClasses').isInt({ min: 0 }).withMessage('Attended classes must be a non-negative number.'),
];

module.exports = { createAttendanceValidators };
