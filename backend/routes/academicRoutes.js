const express = require('express');
const {
  getStudentAcademics, createAcademicRecord, updateAcademicRecord, deleteAcademicRecord,
} = require('../controllers/academicController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { createAcademicValidators } = require('../validators/academic.validators');

const router = express.Router();

router.get('/student/:studentId', verifyToken, getStudentAcademics);
router.post('/', verifyToken, requireRole('admin', 'mentor'), createAcademicValidators, validate, createAcademicRecord);
router.put('/:id', verifyToken, requireRole('admin', 'mentor'), updateAcademicRecord);
router.delete('/:id', verifyToken, requireRole('admin', 'mentor'), deleteAcademicRecord);

module.exports = router;
