const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const Student = require('../models/Student');
const User = require('../models/User');
const Mentor = require('../models/Mentor');
const Counselor = require('../models/Counselor');
const CounselingSession = require('../models/CounselingSession');
const Intervention = require('../models/Intervention');
const FollowUp = require('../models/FollowUp');
const Appointment = require('../models/Appointment');
const Department = require('../models/Department');
const { evaluateStudentAttention } = require('../services/attentionEngine');
const { getStudentRiskInputs, batchStudentRiskInputs } = require('../services/studentDataAggregator');
const { autoFlagOverdueFollowUps } = require('../services/followUpAutoFlag.service');
const { summarizeAttendance } = require('../services/attendanceCalculator');
const { computeSemesterGPA } = require('../services/gpaCalculator');

// Batch evaluate attention status for an array of student IDs
async function attentionForStudentIds(studentIds) {
  if (!studentIds || studentIds.length === 0) return [];
  const inputsMap = await batchStudentRiskInputs(studentIds);
  const results = [];
  for (const id of studentIds) {
    const inputs = inputsMap.get(String(id));
    if (inputs) {
      results.push({ studentId: id, ...evaluateStudentAttention(inputs) });
    }
  }
  return results;
}

// GET /api/dashboard/mentor
const getMentorDashboard = asyncHandler(async (req, res) => {
  const students = await Student.find({ assignedMentor: req.user._id, enrollmentStatus: 'active' })
    .populate('department', 'name code')
    .populate('user', 'name email avatar');

  const attention = await attentionForStudentIds(students.map((s) => s._id));
  const byStatus = { Stable: 0, 'Needs Attention': 0, 'High Priority': 0 };
  attention.forEach((a) => { byStatus[a.status] = (byStatus[a.status] || 0) + 1; });

  const priorityStudents = attention
    .filter((a) => a.status !== 'Stable')
    .map((a) => ({
      ...a,
      attendancePercentage: a.signals?.attendancePercentage ?? null,
      gpa: a.signals?.gpa ?? null,
      arrearCount: a.signals?.arrearCount ?? 0,
      student: students.find((s) => String(s._id) === String(a.studentId)),
    }))
    .sort((a, b) => (a.status === 'High Priority' ? -1 : 1));

  const attendanceConcernsCount = attention.filter(
    (a) => a.signals?.attendanceStatus === 'Critical' || a.signals?.attendanceStatus === 'Attention Required'
  ).length;

  const academicConcernsCount = attention.filter(
    (a) => (a.signals?.gpa !== null && a.signals?.gpa < 5.5) || (a.signals?.arrearCount > 0)
  ).length;

  const studentIds = students.map((s) => s._id);

  await autoFlagOverdueFollowUps({ student: { $in: studentIds } });

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const studentPopulate = {
    path: 'student',
    select: 'studentCode department user',
    populate: { path: 'user', select: 'name email' },
  };

  const [upcomingCounseling, pendingFollowUps, overdueFollowUps, activeInterventions, todayAppointments] = await Promise.all([
    CounselingSession.find({ student: { $in: studentIds }, status: 'Scheduled' })
      .populate(studentPopulate).sort({ date: 1 }).limit(10),
    FollowUp.find({ student: { $in: studentIds }, status: 'Pending' })
      .populate(studentPopulate).sort({ dueDate: 1 }).limit(10),
    FollowUp.find({ student: { $in: studentIds }, status: 'Overdue' })
      .populate(studentPopulate).sort({ dueDate: 1 }).limit(10),
    Intervention.find({ student: { $in: studentIds }, status: { $in: ['Open', 'In Progress', 'Follow-up'] } })
      .populate(studentPopulate).sort({ createdAt: -1 }).limit(10),
    Appointment.find({
      $or: [{ withUser: req.user._id }, { requestedBy: req.user._id }],
      status: { $in: ['Confirmed', 'Pending'] },
      $or: [
        { confirmedDate: { $gte: startOfDay, $lte: endOfDay } },
        { confirmedDate: null, preferredDate: { $gte: startOfDay, $lte: endOfDay } },
      ],
    }).populate(studentPopulate).sort({ confirmedDate: 1, preferredDate: 1 }),
  ]);

  sendSuccess(res, 200, {
    totalAssignedStudents: students.length,
    statusBreakdown: byStatus,
    attendanceConcernsCount,
    academicConcernsCount,
    todayAppointments,
    todayAppointmentsCount: todayAppointments.length,
    priorityStudents: priorityStudents.slice(0, 15),
    upcomingCounseling,
    pendingFollowUps,
    overdueFollowUps,
    activeInterventions,
  }, 'Mentor dashboard data fetched.');
});

// GET /api/dashboard/admin
const getAdminDashboard = asyncHandler(async (req, res) => {
  const [
    totalStudents,
    totalMentors,
    totalCounselors,
    activeStudentsCount,
    inactiveStudentsCount,
    activeMentorsCount,
    activeCounselorsCount,
    departments,
    mentorProfiles,
  ] = await Promise.all([
    Student.countDocuments(),
    Mentor.countDocuments(),
    Counselor.countDocuments(),
    Student.countDocuments({ enrollmentStatus: 'active' }),
    Student.countDocuments({ enrollmentStatus: 'inactive' }),
    User.countDocuments({ role: 'mentor', status: 'active' }),
    User.countDocuments({ role: 'counselor', status: 'active' }),
    Department.find().lean(),
    Mentor.find().populate('user', 'name').lean(),
  ]);

  const activeStudents = await Student.find({ enrollmentStatus: 'active' }).select('_id department');
  const attention = await attentionForStudentIds(activeStudents.map((s) => s._id));
  const byStatus = { Stable: 0, 'Needs Attention': 0, 'High Priority': 0 };
  attention.forEach((a) => { byStatus[a.status] = (byStatus[a.status] || 0) + 1; });

  // Single aggregation query for department student counts (eliminates N+1)
  const deptCounts = await Student.aggregate([
    { $match: { enrollmentStatus: 'active' } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
  ]);
  const deptCountMap = new Map(deptCounts.map((d) => [String(d._id), d.count]));
  const departmentStats = departments.map((d) => ({
    department: d.name,
    code: d.code,
    studentCount: deptCountMap.get(String(d._id)) || 0,
  }));

  const [activeInterventions, counselingThisMonth] = await Promise.all([
    Intervention.countDocuments({ status: { $in: ['Open', 'In Progress', 'Follow-up'] } }),
    CounselingSession.countDocuments({ date: { $gte: new Date(new Date().setDate(1)) } }),
  ]);

  // Single aggregation query for mentor student workload (eliminates N+1)
  const mentorCounts = await Student.aggregate([
    { $match: { enrollmentStatus: 'active', assignedMentor: { $ne: null } } },
    { $group: { _id: '$assignedMentor', count: { $sum: 1 } } },
  ]);
  const mentorCountMap = new Map(mentorCounts.map((m) => [String(m._id), m.count]));
  const workload = mentorProfiles.map((m) => ({
    mentor: m.user?.name || 'Unknown',
    count: mentorCountMap.get(String(m.user?._id)) || 0,
    maxLoad: m.maxStudentLoad,
  }));

  sendSuccess(res, 200, {
    totalStudents,
    totalMentors,
    totalCounselors,
    activeStudentsCount,
    inactiveStudentsCount,
    activeMentorsCount,
    activeCounselorsCount,
    statusBreakdown: byStatus,
    activeInterventions,
    counselingThisMonth,
    departmentStats,
    mentorWorkload: workload,
  }, 'Admin dashboard data fetched.');
});

// GET /api/dashboard/student
const getStudentDashboard = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id })
    .populate('user', 'name email phone avatar')
    .populate('department', 'name code')
    .populate('assignedMentor', 'name email phone');
  if (!student) throw new ApiError(404, 'Student profile not found.');

  const inputs = await getStudentRiskInputs(student._id);
  const attention = evaluateStudentAttention(inputs || {});

  const attendanceSummary = summarizeAttendance(inputs?.attendanceRecords || []);
  const gpa = computeSemesterGPA(inputs?.academicRecords || []);
  const arrearCount = (inputs?.academicRecords || []).filter((r) => r.isArrear).length;
  const academicSummary = {
    gpa,
    arrearCount,
  };

  await autoFlagOverdueFollowUps({ student: student._id });

  const [activeInterventions, nextCounseling, nextFollowUp] = await Promise.all([
    Intervention.find({ student: student._id, status: { $in: ['Open', 'In Progress', 'Follow-up'] } })
      .select('problemIdentified interventionType status createdAt')
      .sort({ createdAt: -1 }),
    CounselingSession.findOne({ student: student._id, status: 'Scheduled' })
      .select('date sessionType reason')
      .sort({ date: 1 }),
    FollowUp.findOne({ student: student._id, status: { $in: ['Pending', 'Overdue'] } })
      .select('dueDate notes status')
      .sort({ dueDate: 1 }),
  ]);

  sendSuccess(res, 200, {
    student,
    attendanceSummary,
    academicSummary,
    attention,
    activeInterventions,
    nextCounseling,
    nextFollowUp,
  }, 'Student dashboard data fetched.');
});

// GET /api/dashboard/counselor
const getCounselorDashboard = asyncHandler(async (req, res) => {
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

  const [totalCases, activeCases, scheduledSessions, completedSessions, pendingAppointments, pendingFollowUpsCount, recentSessions] = await Promise.all([
    Intervention.countDocuments({ assignedTo: req.user._id }),
    Intervention.countDocuments({ assignedTo: req.user._id, status: { $in: ['Open', 'In Progress', 'Follow-up'] } }),
    CounselingSession.countDocuments({ conductedBy: req.user._id, status: 'Scheduled' }),
    CounselingSession.countDocuments({ conductedBy: req.user._id, status: 'Completed' }),
    Appointment.countDocuments({ withUser: req.user._id, status: 'Pending' }),
    FollowUp.countDocuments({
      status: 'Pending',
      $or: [
        { createdBy: req.user._id },
        { student: { $in: caseStudentIds } },
      ],
    }),
    CounselingSession.find({ conductedBy: req.user._id }).populate('student', 'studentCode').sort({ date: -1 }).limit(8),
  ]);

  sendSuccess(res, 200, {
    totalCases,
    activeCases,
    scheduledSessions,
    completedSessions,
    pendingAppointments,
    pendingFollowUpsCount,
    recentSessions,
  }, 'Counselor dashboard data fetched.');
});

module.exports = { getMentorDashboard, getAdminDashboard, getStudentDashboard, getCounselorDashboard };
