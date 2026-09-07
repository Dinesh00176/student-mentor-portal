const express = require('express');
const {
  attendanceConcernsReport, academicConcernsReport, counselingActivityReport,
  interventionStatusReport, mentorWorkloadReport, attentionReport,
} = require('../controllers/reportController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

router.get('/attendance-concerns', verifyToken, requireRole('admin'), attendanceConcernsReport);
router.get('/academic-concerns', verifyToken, requireRole('admin'), academicConcernsReport);
router.get('/counseling-activity', verifyToken, requireRole('admin'), counselingActivityReport);
router.get('/intervention-status', verifyToken, requireRole('admin'), interventionStatusReport);
router.get('/mentor-workload', verifyToken, requireRole('admin'), mentorWorkloadReport);
router.get('/students-needing-attention', verifyToken, requireRole('admin'), attentionReport);

module.exports = router;
