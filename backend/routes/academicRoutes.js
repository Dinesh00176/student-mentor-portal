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
router.post('/', verifyToken, requireRole('mentor'), createAcademicValidators, validate, createAcademicRecord);
router.put('/:id', verifyToken, requireRole('mentor'), updateAcademicRecord);
router.delete('/:id', verifyToken, requireRole('mentor'), deleteAcademicRecord);

module.exports = router;
