const express = require('express');
const {
  listDepartments, createDepartment, updateDepartment, deleteDepartment,
} = require('../controllers/departmentController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

router.get('/', verifyToken, listDepartments);
router.post('/', verifyToken, requireRole('admin'), createDepartment);
router.put('/:id', verifyToken, requireRole('admin'), updateDepartment);
router.delete('/:id', verifyToken, requireRole('admin'), deleteDepartment);

module.exports = router;
