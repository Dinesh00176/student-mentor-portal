const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const { getPagination, buildPaginatedResponse } = require('../utils/pagination');
const CounselingSession = require('../models/CounselingSession');
const Student = require('../models/Student');
const { assertMentorOwnsStudent, assertSelf } = require('../services/ownership');
const { logAudit } = require('../services/auditLog.service');

// GET /api/counseling?student=&status=
const listCounselingSessions = asyncHandler(async (req, res) => {
  const { student, status } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};
  if (student) filter.student = student;
  if (status) filter.status = status;

  if (req.user.role === 'mentor') {
    const myStudents = await Student.find({ assignedMentor: req.user._id }).select('_id');
    filter.student = { $in: myStudents.map((s) => s._id) };
    if (student) filter.student = student; // still validated by ownership check below
  }
  if (req.user.role === 'counselor') {
    filter.conductedBy = req.user._id;
  }
  if (req.user.role === 'student') {
    const me = await Student.findOne({ user: req.user._id });
    if (!me) throw new ApiError(404, 'Student profile not found.');
    filter.student = me._id;
  }

  if (student && req.user.role === 'mentor') await assertMentorOwnsStudent(req.user, student);

  const [items, total] = await Promise.all([
    CounselingSession.find(filter)
      .populate('student', 'studentCode')
      .populate('conductedBy', 'name role')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit),
    CounselingSession.countDocuments(filter),
  ]);

  sendSuccess(res, 200, buildPaginatedResponse(items, total, page, limit), 'Counseling sessions fetched.');
});

// POST /api/counseling (mentor/counselor/admin)
const createCounselingSession = asyncHandler(async (req, res) => {
  const { student, date, sessionType, reason, discussionSummary, actionItems, followUpDate, status, outcome } = req.body;
  if (!student || !reason) throw new ApiError(400, 'student and reason are required.');

  if (req.user.role === 'mentor') await assertMentorOwnsStudent(req.user, student);

  const session = await CounselingSession.create({
    student, conductedBy: req.user._id, date, sessionType, reason, discussionSummary, actionItems, followUpDate, status, outcome,
  });
  sendSuccess(res, 201, session, 'Counseling session created.');
});

// PUT /api/counseling/:id (mentor/counselor who conducted, or admin)
const updateCounselingSession = asyncHandler(async (req, res) => {
  const session = await CounselingSession.findById(req.params.id);
  if (!session) throw new ApiError(404, 'Counseling session not found.');

  if (req.user.role === 'mentor') await assertMentorOwnsStudent(req.user, session.student);
  if (req.user.role === 'counselor' && String(session.conductedBy) !== String(req.user._id)) {
    throw new ApiError(403, 'You may only edit sessions you conducted.');
  }

  Object.assign(session, req.body);
  await session.save();

  await logAudit({
    actor: req.user, action: 'CounselingSessionUpdated', targetType: 'CounselingSession', targetId: session._id,
    details: `status -> ${session.status}`,
  });

  sendSuccess(res, 200, session, 'Counseling session updated.');
});

module.exports = { listCounselingSessions, createCounselingSession, updateCounselingSession };
