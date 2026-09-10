const express = require('express');
const { listFollowUps, createFollowUp, updateFollowUp, completeFollowUp } = require('../controllers/followupController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

router.get('/', verifyToken, listFollowUps);
router.post('/', verifyToken, requireRole('admin', 'mentor', 'counselor'), createFollowUp);
router.put('/:id', verifyToken, requireRole('admin', 'mentor', 'counselor'), updateFollowUp);
router.patch('/:id/complete', verifyToken, requireRole('admin', 'mentor', 'counselor'), completeFollowUp);

module.exports = router;
