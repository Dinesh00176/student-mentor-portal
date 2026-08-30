const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const Department = require('../models/Department');

const listDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find().sort({ name: 1 });
  sendSuccess(res, 200, departments, 'Departments fetched.');
});

const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, description } = req.body;
  if (!name || !code) throw new ApiError(400, 'Name and code are required.');
  const department = await Department.create({ name, code, description });
  sendSuccess(res, 201, department, 'Department created.');
});

const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!department) throw new ApiError(404, 'Department not found.');
  sendSuccess(res, 200, department, 'Department updated.');
});

const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndDelete(req.params.id);
  if (!department) throw new ApiError(404, 'Department not found.');
  sendSuccess(res, 200, null, 'Department deleted.');
});

module.exports = { listDepartments, createDepartment, updateDepartment, deleteDepartment };
