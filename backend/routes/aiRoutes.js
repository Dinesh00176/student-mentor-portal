const express = require('express');
const { generateProgressSummary } = require('../controllers/aiController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

router.post('/summary/:studentId', verifyToken, requireRole('admin', 'mentor'), generateProgressSummary);

module.exports = router;
