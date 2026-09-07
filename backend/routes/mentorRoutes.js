const express = require('express');
const {
  listMentors, getMentor, createMentor, updateMentor, updateMentorStatus, deactivateMentor,
} = require('../controllers/mentorController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { createMentorValidators } = require('../validators/mentor.validators');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/', verifyToken, listMentors);
router.get('/:id', verifyToken, getMentor);
router.post('/', verifyToken, requireRole('admin'), createMentorValidators, validate, createMentor);
router.put('/:id', verifyToken, requireRole('admin'), updateMentor);
router.patch('/:id/status', verifyToken, requireRole('admin'), updateMentorStatus);
router.delete('/:id', verifyToken, requireRole('admin'), deactivateMentor);

module.exports = router;
