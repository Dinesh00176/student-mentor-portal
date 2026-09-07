const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const FollowUp = require('../models/FollowUp');
const Student = require('../models/Student');
const { assertMentorOwnsStudent } = require('../services/ownership');
const { autoFlagOverdueFollowUps } = require('../services/followUpAutoFlag.service');
const { logAudit } = require('../services/auditLog.service');

// GET /api/followups?status=&overdue=true
const listFollowUps = asyncHandler(async (req, res) => {
  const { status, overdue, student } = req.query;
  const filter = {};

  if (req.user.role === 'mentor') {
    const myStudents = await Student.find({ assignedMentor: req.user._id }).select('_id');
    filter.student = { $in: myStudents.map((s) => s._id) };
  }
  if (req.user.role === 'student') {
    const me = await Student.findOne({ user: req.user._id });
    if (!me) throw new ApiError(404, 'Student profile not found.');
    filter.student = me._id;
  }
  if (student) filter.student = student;

  // Auto-transition any newly-overdue Pending items (and notify the mentor
  // once) before applying status filters, so "Overdue" is always accurate
  // without needing a background scheduler.
  await autoFlagOverdueFollowUps(filter);

  if (status) filter.status = status;
  if (overdue === 'true') filter.status = 'Overdue';

  const items = await FollowUp.find(filter)
    .populate('student', 'studentCode')
    .populate('createdBy', 'name role')
    .sort({ dueDate: 1 });

  sendSuccess(res, 200, items, 'Follow-ups fetched.');
});

// POST /api/followups
const createFollowUp = asyncHandler(async (req, res) => {
  const { student, relatedTo, dueDate, notes } = req.body;
  if (!student || !dueDate) throw new ApiError(400, 'student and dueDate are required.');
  if (req.user.role === 'mentor') await assertMentorOwnsStudent(req.user, student);

  const followUp = await FollowUp.create({ student, relatedTo, dueDate, notes, createdBy: req.user._id });
  await logAudit({
    actor: req.user, action: 'FollowUpCreated', targetType: 'FollowUp', targetId: followUp._id,
  });
  sendSuccess(res, 201, followUp, 'Follow-up scheduled.');
});

// PATCH /api/followups/:id/complete
const completeFollowUp = asyncHandler(async (req, res) => {
  const { outcome } = req.body;
  const followUp = await FollowUp.findById(req.params.id);
  if (!followUp) throw new ApiError(404, 'Follow-up not found.');
  if (req.user.role === 'mentor') await assertMentorOwnsStudent(req.user, followUp.student);

  followUp.status = 'Completed';
  if (outcome) followUp.outcome = outcome;
  await followUp.save();
  await logAudit({
    actor: req.user, action: 'FollowUpCompleted', targetType: 'FollowUp', targetId: followUp._id,
  });
  sendSuccess(res, 200, followUp, 'Follow-up marked complete.');
});

module.exports = { listFollowUps, createFollowUp, completeFollowUp };
