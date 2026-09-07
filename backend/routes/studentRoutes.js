const express = require('express');
const {
  listStudents, getStudent, createStudent, updateStudent, deactivateStudent, assignMentor, getStudentAttention,
} = require('../controllers/studentController');
const { getStudentActivity } = require('../controllers/activityController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { createStudentValidators } = require('../validators/student.validators');

const router = express.Router();

router.get('/', verifyToken, requireRole('admin', 'mentor'), listStudents);
router.post('/', verifyToken, requireRole('admin'), createStudentValidators, validate, createStudent);
router.get('/:id', verifyToken, getStudent);
router.put('/:id', verifyToken, requireRole('admin'), updateStudent);
router.delete('/:id', verifyToken, requireRole('admin'), deactivateStudent);
router.patch('/:id/assign-mentor', verifyToken, requireRole('admin'), assignMentor);
router.get('/:id/attention', verifyToken, requireRole('admin', 'mentor'), getStudentAttention);
router.get('/:id/activity', verifyToken, getStudentActivity);

module.exports = router;
