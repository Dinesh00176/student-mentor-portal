const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const { getPagination, buildPaginatedResponse } = require('../utils/pagination');
const CounselingSession = require('../models/CounselingSession');
const Student = require('../models/Student');
const { assertMentorOwnsStudent, assertCounselorAuthorizedForStudent, assertSelf } = require('../services/ownership');
const { logAudit } = require('../services/auditLog.service');

// GET /api/counseling?student=&status=
const listCounselingSessions = asyncHandler(async (req, res) => {
  const { student, status } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};
  if (status) filter.status = status;

  if (req.user.role === 'mentor') {
    const myStudents = await Student.find({ assignedMentor: req.user._id }).select('_id');
    filter.student = { $in: myStudents.map((s) => s._id) };
    if (student) {
      await assertMentorOwnsStudent(req.user, student);
      filter.student = student;
    }
  } else if (req.user.role === 'counselor') {
    filter.conductedBy = req.user._id;
    if (student) {
      await assertCounselorAuthorizedForStudent(req.user, student);
      filter.student = student;
    }
  } else if (req.user.role === 'student') {
    const me = await Student.findOne({ user: req.user._id });
    if (!me) throw new ApiError(404, 'Student profile not found.');
    filter.student = me._id;
  } else if (student) {
    filter.student = student;
  }

  const [items, total] = await Promise.all([
    CounselingSession.find(filter)
      .populate({
        path: 'student',
        select: 'studentCode department user',
        populate: [
          { path: 'user', select: 'name email' },
          { path: 'department', select: 'name code' },
        ],
      })
      .populate('conductedBy', 'name role email')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit),
    CounselingSession.countDocuments(filter),
  ]);

  // Enforce discussion summary / private counseling note privacy
  // Mask notes for students and mentors (unless mentor personally conducted the session)
  const sanitizedItems = items.map((item) => {
    const doc = item.toObject ? item.toObject() : { ...item };
    const isConductingAuthor = String(doc.conductedBy?._id || doc.conductedBy) === String(req.user._id);
    if (req.user.role === 'admin' || (req.user.role === 'counselor' && isConductingAuthor)) {
      return doc;
    }
    if (isConductingAuthor) return doc;
    return {
      ...doc,
      discussionSummary: '[Confidential Counseling Notes - Restricted to Counselor]',
    };
  });

  sendSuccess(res, 200, buildPaginatedResponse(sanitizedItems, total, page, limit), 'Counseling sessions fetched.');
});

// POST /api/counseling (mentor/counselor/admin)
const createCounselingSession = asyncHandler(async (req, res) => {
  const { student, date, sessionType, reason, discussionSummary, actionItems, followUpDate, status, outcome } = req.body;
  if (!student || !reason) throw new ApiError(400, 'student and reason are required.');

  if (req.user.role === 'mentor') await assertMentorOwnsStudent(req.user, student);
  if (req.user.role === 'counselor') await assertCounselorAuthorizedForStudent(req.user, student);

  const session = await CounselingSession.create({
    student, conductedBy: req.user._id, date, sessionType, reason, discussionSummary, actionItems, followUpDate, status, outcome,
  });
  sendSuccess(res, 201, session, 'Counseling session created.');
});

// PUT /api/counseling/:id (mentor/counselor who conducted, or admin)
const updateCounselingSession = asyncHandler(async (req, res) => {
  const session = await CounselingSession.findById(req.params.id);
  if (!session) throw new ApiError(404, 'Counseling session not found.');

  if (req.user.role === 'mentor') {
    await assertMentorOwnsStudent(req.user, session.student);
    if (String(session.conductedBy) !== String(req.user._id)) {
      throw new ApiError(403, 'Mentors may only edit counseling sessions they personally conducted.');
    }
  }
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
