const express = require('express');
const {
  getMentorDashboard, getAdminDashboard, getStudentDashboard, getCounselorDashboard,
} = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

router.get('/mentor', verifyToken, requireRole('mentor'), getMentorDashboard);
router.get('/admin', verifyToken, requireRole('admin'), getAdminDashboard);
router.get('/student', verifyToken, requireRole('student'), getStudentDashboard);
router.get('/counselor', verifyToken, requireRole('counselor'), getCounselorDashboard);

module.exports = router;
