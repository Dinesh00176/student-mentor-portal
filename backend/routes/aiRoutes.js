const express = require('express');
const {
  generateProgressSummary,
  generateMeetingPreparation,
  summarizeNotes,
} = require('../controllers/aiController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

router.post('/summary/:studentId', verifyToken, requireRole('admin', 'mentor'), generateProgressSummary);
router.post('/meeting-prep/:studentId', verifyToken, requireRole('admin', 'mentor', 'counselor'), generateMeetingPreparation);
router.post('/summarize-notes', verifyToken, requireRole('admin', 'mentor', 'counselor'), summarizeNotes);

module.exports = router;
