const express = require('express');
const { getStudentRemarks, createRemark, updateRemark } = require('../controllers/remarkController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

router.get('/student/:studentId', verifyToken, getStudentRemarks);
router.post('/', verifyToken, requireRole('mentor'), createRemark);
router.put('/:id', verifyToken, requireRole('mentor'), updateRemark);

module.exports = router;
