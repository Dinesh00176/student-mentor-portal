const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const FollowUp = require('../models/FollowUp');
const Student = require('../models/Student');
const Intervention = require('../models/Intervention');
const CounselingSession = require('../models/CounselingSession');
const Appointment = require('../models/Appointment');
const { assertMentorOwnsStudent, assertCounselorAuthorizedForStudent } = require('../services/ownership');
const { autoFlagOverdueFollowUps } = require('../services/followUpAutoFlag.service');
const { logAudit } = require('../services/auditLog.service');

// GET /api/followups?status=&overdue=true
const listFollowUps = asyncHandler(async (req, res) => {
  const { status, overdue, student } = req.query;
  const filter = {};

  if (req.user.role === 'mentor') {
    const myStudents = await Student.find({ assignedMentor: req.user._id }).select('_id');
    filter.student = { $in: myStudents.map((s) => s._id) };
    if (student) {
      await assertMentorOwnsStudent(req.user, student);
      filter.student = student;
    }
  } else if (req.user.role === 'counselor') {
    const [myInterventions, mySessions, myAppts] = await Promise.all([
      Intervention.find({ assignedTo: req.user._id }).select('student'),
      CounselingSession.find({ conductedBy: req.user._id }).select('student'),
      Appointment.find({ withUser: req.user._id }).select('student'),
    ]);
    const caseStudentIds = [
      ...new Set([
        ...myInterventions.map((i) => String(i.student)),
        ...mySessions.map((s) => String(s.student)),
        ...myAppts.map((a) => String(a.student)),
      ]),
    ];
    if (student) {
      await assertCounselorAuthorizedForStudent(req.user, student);
      filter.student = student;
    } else {
      filter.$or = [
        { createdBy: req.user._id },
        { student: { $in: caseStudentIds } },
      ];
    }
  } else if (req.user.role === 'student') {
    const me = await Student.findOne({ user: req.user._id });
    if (!me) throw new ApiError(404, 'Student profile not found.');
    filter.student = me._id;
  } else if (student) {
    filter.student = student;
  }

  // Auto-transition any newly-overdue Pending items before applying status filters
  await autoFlagOverdueFollowUps(filter);

  if (status) filter.status = status;
  if (overdue === 'true') filter.status = 'Overdue';

  const items = await FollowUp.find(filter)
    .populate({
      path: 'student',
      select: 'studentCode department user',
      populate: [
        { path: 'user', select: 'name email' },
        { path: 'department', select: 'name code' },
      ],
    })
    .populate('createdBy', 'name role')
    .sort({ dueDate: 1 });

  sendSuccess(res, 200, items, 'Follow-ups fetched.');
});

// POST /api/followups
const createFollowUp = asyncHandler(async (req, res) => {
  const { student, relatedTo, dueDate, notes } = req.body;
  if (!student || !dueDate) throw new ApiError(400, 'student and dueDate are required.');

  if (req.user.role === 'mentor') await assertMentorOwnsStudent(req.user, student);
  if (req.user.role === 'counselor') await assertCounselorAuthorizedForStudent(req.user, student);

  const followUp = await FollowUp.create({ student, relatedTo, dueDate, notes, createdBy: req.user._id });
  await logAudit({
    actor: req.user, action: 'FollowUpCreated', targetType: 'FollowUp', targetId: followUp._id,
  });
  sendSuccess(res, 201, followUp, 'Follow-up scheduled.');
});

// PUT /api/followups/:id (mentor/counselor/admin)
const updateFollowUp = asyncHandler(async (req, res) => {
  const { dueDate, notes, status, outcome } = req.body;
  const followUp = await FollowUp.findById(req.params.id);
  if (!followUp) throw new ApiError(404, 'Follow-up not found.');

  if (req.user.role === 'mentor') await assertMentorOwnsStudent(req.user, followUp.student);
  if (req.user.role === 'counselor') {
    if (String(followUp.createdBy) !== String(req.user._id)) {
      await assertCounselorAuthorizedForStudent(req.user, followUp.student);
    }
  }

  if (dueDate) followUp.dueDate = dueDate;
  if (notes !== undefined) followUp.notes = notes;
  if (status) followUp.status = status;
  if (outcome !== undefined) followUp.outcome = outcome;

  await followUp.save();
  await logAudit({
    actor: req.user, action: 'FollowUpUpdated', targetType: 'FollowUp', targetId: followUp._id,
  });
  sendSuccess(res, 200, followUp, 'Follow-up updated.');
});

// PATCH /api/followups/:id/complete
const completeFollowUp = asyncHandler(async (req, res) => {
  const { outcome } = req.body;
  const followUp = await FollowUp.findById(req.params.id);
  if (!followUp) throw new ApiError(404, 'Follow-up not found.');

  if (req.user.role === 'mentor') await assertMentorOwnsStudent(req.user, followUp.student);
  if (req.user.role === 'counselor') {
    if (String(followUp.createdBy) !== String(req.user._id)) {
      await assertCounselorAuthorizedForStudent(req.user, followUp.student);
    }
  }

  followUp.status = 'Completed';
  if (outcome) followUp.outcome = outcome;
  await followUp.save();
  await logAudit({
    actor: req.user, action: 'FollowUpCompleted', targetType: 'FollowUp', targetId: followUp._id,
  });
  sendSuccess(res, 200, followUp, 'Follow-up marked complete.');
});

module.exports = { listFollowUps, createFollowUp, updateFollowUp, completeFollowUp };
