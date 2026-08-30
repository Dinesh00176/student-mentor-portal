const express = require('express');
const { listAppointments, createAppointment, updateAppointmentStatus } = require('../controllers/appointmentController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { createAppointmentValidators } = require('../validators/appointment.validators');

const router = express.Router();

router.get('/', verifyToken, listAppointments);
router.post('/', verifyToken, requireRole('student'), createAppointmentValidators, validate, createAppointment);
router.patch('/:id/status', verifyToken, requireRole('admin', 'mentor', 'counselor'), updateAppointmentStatus);

module.exports = router;
