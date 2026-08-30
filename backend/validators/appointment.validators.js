const { body } = require('express-validator');

const createAppointmentValidators = [
  body('withUser').isMongoId().withMessage('A valid mentor/counselor is required.'),
  body('reason').trim().notEmpty().withMessage('Reason is required.'),
  body('preferredDate').isISO8601().withMessage('A valid preferred date is required.'),
];

module.exports = { createAppointmentValidators };
