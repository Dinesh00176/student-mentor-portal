const express = require('express');
const {
  listCounselors, createCounselor, updateCounselor, updateCounselorStatus, deactivateCounselor,
} = require('../controllers/counselorController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { createCounselorValidators } = require('../validators/counselor.validators');

const router = express.Router();

router.get('/', verifyToken, requireRole('admin'), listCounselors);
router.post('/', verifyToken, requireRole('admin'), createCounselorValidators, validate, createCounselor);
router.put('/:id', verifyToken, requireRole('admin'), updateCounselor);
router.patch('/:id/status', verifyToken, requireRole('admin'), updateCounselorStatus);
router.delete('/:id', verifyToken, requireRole('admin'), deactivateCounselor);

module.exports = router;
