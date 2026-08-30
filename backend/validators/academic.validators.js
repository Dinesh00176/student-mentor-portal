const { body } = require('express-validator');

const createAcademicValidators = [
  body('student').isMongoId().withMessage('A valid student is required.'),
  body('semester').isInt({ min: 1, max: 12 }).withMessage('Semester must be between 1 and 12.'),
  body('subject').trim().notEmpty().withMessage('Subject is required.'),
  body('internalMarks').optional().isFloat({ min: 0, max: 100 }).withMessage('Internal marks must be 0-100.'),
  body('examMarks').optional().isFloat({ min: 0, max: 100 }).withMessage('Exam marks must be 0-100.'),
  body('gradePoint').optional().isFloat({ min: 0, max: 10 }).withMessage('Grade point must be 0-10.'),
];

module.exports = { createAcademicValidators };
