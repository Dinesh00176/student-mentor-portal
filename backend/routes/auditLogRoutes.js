const express = require('express');
const { listAuditLogs } = require('../controllers/auditLogController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

router.get('/', verifyToken, requireRole('admin'), listAuditLogs);

module.exports = router;
