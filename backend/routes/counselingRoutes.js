const express = require('express');
const {
  listCounselingSessions, createCounselingSession, updateCounselingSession,
} = require('../controllers/counselingController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

router.get('/', verifyToken, listCounselingSessions);
router.post('/', verifyToken, requireRole('admin', 'mentor', 'counselor'), createCounselingSession);
router.put('/:id', verifyToken, requireRole('admin', 'mentor', 'counselor'), updateCounselingSession);

module.exports = router;
