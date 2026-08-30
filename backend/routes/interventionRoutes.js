const express = require('express');
const {
  listInterventions, createIntervention, updateInterventionStatus,
} = require('../controllers/interventionController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

router.get('/', verifyToken, listInterventions);
router.post('/', verifyToken, requireRole('admin', 'mentor', 'counselor'), createIntervention);
router.patch('/:id/status', verifyToken, requireRole('admin', 'mentor', 'counselor'), updateInterventionStatus);

module.exports = router;
