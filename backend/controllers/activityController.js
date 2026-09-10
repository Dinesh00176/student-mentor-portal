const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const Student = require('../models/Student');
const CounselingSession = require('../models/CounselingSession');
const MentorRemark = require('../models/MentorRemark');
const Intervention = require('../models/Intervention');
const FollowUp = require('../models/FollowUp');
const AttendanceRecord = require('../models/AttendanceRecord');
const { assertCanAccessStudent } = require('../services/ownership');

// GET /api/students/:id/activity - a derived, read-only chronological feed
const getStudentActivity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await assertCanAccessStudent(req.user, id);

  const [sessions, remarks, interventions, followUps] = await Promise.all([
    CounselingSession.find({ student: id }).select('date status sessionType reason'),
    req.user.role === 'counselor' ? [] : MentorRemark.find({ student: id }).select('createdAt category content'),
    Intervention.find({ student: id }).select('createdAt status problemIdentified history'),
    FollowUp.find({ student: id }).select('createdAt dueDate status'),
  ]);

  const events = [];
  sessions.forEach((s) => events.push({
    date: s.date, type: 'Counseling', title: `Counseling session: ${s.status}`, detail: s.reason,
  }));
  remarks.forEach((r) => events.push({
    date: r.createdAt, type: 'Remark', title: `Mentor remark added (${r.category})`, detail: r.content,
  }));
  interventions.forEach((i) => {
    events.push({ date: i.createdAt, type: 'Intervention', title: 'Intervention created', detail: i.problemIdentified });
    (i.history || []).forEach((h) => {
      if (h.status !== 'Open') {
        events.push({ date: h.changedAt, type: 'Intervention', title: `Intervention status: ${h.status}`, detail: h.note });
      }
    });
  });
  followUps.forEach((f) => events.push({
    date: f.createdAt, type: 'Follow-up', title: `Follow-up scheduled (${f.status})`, detail: `Due ${new Date(f.dueDate).toDateString()}`,
  }));

  events.sort((a, b) => new Date(b.date) - new Date(a.date));

  sendSuccess(res, 200, events, 'Activity timeline fetched.');
});

module.exports = { getStudentActivity };
