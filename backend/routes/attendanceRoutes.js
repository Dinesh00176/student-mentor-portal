const express = require('express');
const {
  getStudentAttendance, createAttendanceRecord, updateAttendanceRecord, deleteAttendanceRecord,
} = require('../controllers/attendanceController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { createAttendanceValidators } = require('../validators/attendance.validators');

const router = express.Router();

router.get('/student/:studentId', verifyToken, getStudentAttendance);
router.post('/', verifyToken, requireRole('mentor'), createAttendanceValidators, validate, createAttendanceRecord);
router.put('/:id', verifyToken, requireRole('mentor'), updateAttendanceRecord);
router.delete('/:id', verifyToken, requireRole('mentor'), deleteAttendanceRecord);

module.exports = router;
