const express = require('express');

const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/departments', require('./departmentRoutes'));
router.use('/students', require('./studentRoutes'));
router.use('/mentors', require('./mentorRoutes'));
router.use('/counselors', require('./counselorRoutes'));
router.use('/academic', require('./academicRoutes'));
router.use('/attendance', require('./attendanceRoutes'));
router.use('/counseling', require('./counselingRoutes'));
router.use('/remarks', require('./remarkRoutes'));
router.use('/interventions', require('./interventionRoutes'));
router.use('/followups', require('./followupRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/reports', require('./reportRoutes'));
router.use('/ai', require('./aiRoutes'));
router.use('/appointments', require('./appointmentRoutes'));
router.use('/audit-logs', require('./auditLogRoutes'));

module.exports = router;
