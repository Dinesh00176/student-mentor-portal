const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const { getPagination, buildPaginatedResponse } = require('../utils/pagination');
const Intervention = require('../models/Intervention');
const Student = require('../models/Student');
const { assertMentorOwnsStudent, assertSelf } = require('../services/ownership');
const { logAudit } = require('../services/auditLog.service');
const { notify } = require('../services/notify.service');

// GET /api/interventions?student=&status=
const listInterventions = asyncHandler(async (req, res) => {
  const { student, status } = req.query;
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (status) filter.status = status;

  if (req.user.role === 'mentor') {
    const myStudents = await Student.find({ assignedMentor: req.user._id }).select('_id');
    filter.student = { $in: myStudents.map((s) => s._id) };
  }
  if (req.user.role === 'counselor') {
    filter.assignedTo = req.user._id;
  }
  if (req.user.role === 'student') {
    const me = await Student.findOne({ user: req.user._id });
    if (!me) throw new ApiError(404, 'Student profile not found.');
    filter.student = me._id;
  }
  if (student) {
    if (req.user.role === 'mentor') await assertMentorOwnsStudent(req.user, student);
    filter.student = student;
  }

  const [items, total] = await Promise.all([
    Intervention.find(filter)
      .populate('student', 'studentCode')
      .populate('assignedTo', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Intervention.countDocuments(filter),
  ]);

  sendSuccess(res, 200, buildPaginatedResponse(items, total, page, limit), 'Interventions fetched.');
});

// POST /api/interventions (mentor/counselor/admin)
const createIntervention = asyncHandler(async (req, res) => {
  const { student, problemIdentified, interventionType, actionTaken, assignedTo, followUpDate, notes } = req.body;
  if (!student || !problemIdentified) throw new ApiError(400, 'student and problemIdentified are required.');
  if (req.user.role === 'mentor') await assertMentorOwnsStudent(req.user, student);

  const intervention = await Intervention.create({
    student,
    problemIdentified,
    interventionType,
    actionTaken,
    assignedTo: assignedTo || req.user._id,
    followUpDate,
    notes,
    history: [{ status: 'Open', changedBy: req.user._id, note: 'Intervention created.' }],
  });

  await logAudit({
    actor: req.user, action: 'InterventionCreated', targetType: 'Intervention', targetId: intervention._id,
    details: problemIdentified.slice(0, 120),
  });

  const studentDoc = await Student.findById(student).select('assignedMentor studentCode');
  if (studentDoc?.assignedMentor && String(studentDoc.assignedMentor) !== String(req.user._id)) {
    await notify({
      user: studentDoc.assignedMentor, type: 'General', relatedStudent: student,
      message: `A new intervention was created for ${studentDoc.studentCode}.`,
    });
  }

  sendSuccess(res, 201, intervention, 'Intervention created.');
});

// PATCH /api/interventions/:id/status
const updateInterventionStatus = asyncHandler(async (req, res) => {
  const { status, note, outcome, actionTaken } = req.body;
  const validStatuses = ['Open', 'In Progress', 'Follow-up', 'Resolved', 'Closed'];
  if (!status || !validStatuses.includes(status)) {
    throw new ApiError(400, `status must be one of: ${validStatuses.join(', ')}`);
  }

  const intervention = await Intervention.findById(req.params.id);
  if (!intervention) throw new ApiError(404, 'Intervention not found.');
  if (req.user.role === 'mentor') await assertMentorOwnsStudent(req.user, intervention.student);
  if (req.user.role === 'counselor' && String(intervention.assignedTo) !== String(req.user._id)) {
    throw new ApiError(403, 'You may only update interventions assigned to you.');
  }

  intervention.status = status;
  if (outcome) intervention.outcome = outcome;
  if (actionTaken) intervention.actionTaken = actionTaken;
  intervention.history.push({ status, changedBy: req.user._id, note: note || '' });
  await intervention.save();

  await logAudit({
    actor: req.user, action: 'InterventionStatusChanged', targetType: 'Intervention', targetId: intervention._id,
    details: `status -> ${status}`,
  });

  sendSuccess(res, 200, intervention, 'Intervention status updated.');
});

module.exports = { listInterventions, createIntervention, updateInterventionStatus };
