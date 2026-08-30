const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const Student = require('../models/Student');
const Mentor = require('../models/Mentor');
const Counselor = require('../models/Counselor');
const CounselingSession = require('../models/CounselingSession');
const Intervention = require('../models/Intervention');
const FollowUp = require('../models/FollowUp');
const Appointment = require('../models/Appointment');
const Department = require('../models/Department');
const { evaluateStudentAttention } = require('../services/attentionEngine');
const { getStudentRiskInputs } = require('../services/studentDataAggregator');
const { autoFlagOverdueFollowUps } = require('../services/followUpAutoFlag.service');

async function attentionForStudentIds(studentIds) {
  const results = [];
  for (const id of studentIds) {
    const inputs = await getStudentRiskInputs(id); // eslint-disable-line no-await-in-loop
    if (inputs) results.push({ studentId: id, ...evaluateStudentAttention(inputs) });
  }
  return results;
}

// GET /api/dashboard/mentor
const getMentorDashboard = asyncHandler(async (req, res) => {
  const students = await Student.find({ assignedMentor: req.user._id, enrollmentStatus: 'active' })
    .populate('department', 'name');

  const attention = await attentionForStudentIds(students.map((s) => s._id));
  const byStatus = { Stable: 0, 'Needs Attention': 0, 'High Priority': 0 };
  attention.forEach((a) => { byStatus[a.status] = (byStatus[a.status] || 0) + 1; });

  const priorityStudents = attention
    .filter((a) => a.status !== 'Stable')
    .map((a) => ({
      ...a,
      student: students.find((s) => String(s._id) === String(a.studentId)),
    }))
    .sort((a, b) => (a.status === 'High Priority' ? -1 : 1));

  const studentIds = students.map((s) => s._id);

  await autoFlagOverdueFollowUps({ student: { $in: studentIds } });

  const [upcomingCounseling, pendingFollowUps, overdueFollowUps, activeInterventions] = await Promise.all([
    CounselingSession.find({ student: { $in: studentIds }, status: 'Scheduled' })
      .populate('student', 'studentCode').sort({ date: 1 }).limit(10),
    FollowUp.find({ student: { $in: studentIds }, status: 'Pending' })
      .populate('student', 'studentCode').sort({ dueDate: 1 }).limit(10),
    FollowUp.find({ student: { $in: studentIds }, status: 'Overdue' })
      .populate('student', 'studentCode').sort({ dueDate: 1 }).limit(10),
    Intervention.find({ student: { $in: studentIds }, status: { $in: ['Open', 'In Progress', 'Follow-up'] } })
      .populate('student', 'studentCode').sort({ createdAt: -1 }).limit(10),
  ]);

  sendSuccess(res, 200, {
    totalAssignedStudents: students.length,
    statusBreakdown: byStatus,
    priorityStudents: priorityStudents.slice(0, 15),
    upcomingCounseling,
    pendingFollowUps,
    overdueFollowUps,
    activeInterventions,
  }, 'Mentor dashboard data fetched.');
});

// GET /api/dashboard/admin
const getAdminDashboard = asyncHandler(async (req, res) => {
  const [totalStudents, totalMentors, totalCounselors, departments] = await Promise.all([
    Student.countDocuments({ enrollmentStatus: 'active' }),
    Mentor.countDocuments(),
    Counselor.countDocuments(),
    Department.find(),
  ]);

  const activeStudents = await Student.find({ enrollmentStatus: 'active' }).select('_id department');
  const attention = await attentionForStudentIds(activeStudents.map((s) => s._id));
  const byStatus = { Stable: 0, 'Needs Attention': 0, 'High Priority': 0 };
  attention.forEach((a) => { byStatus[a.status] = (byStatus[a.status] || 0) + 1; });

  const departmentStats = await Promise.all(
    departments.map(async (d) => {
      const count = await Student.countDocuments({ department: d._id, enrollmentStatus: 'active' });
      return { department: d.name, code: d.code, studentCount: count };
    })
  );

  const [activeInterventions, counselingThisMonth] = await Promise.all([
    Intervention.countDocuments({ status: { $in: ['Open', 'In Progress', 'Follow-up'] } }),
    CounselingSession.countDocuments({ date: { $gte: new Date(new Date().setDate(1)) } }),
  ]);

  const mentorWorkload = await Mentor.find().populate('user', 'name');
  const workload = await Promise.all(
    mentorWorkload.map(async (m) => ({
      mentor: m.user?.name,
      count: await Student.countDocuments({ assignedMentor: m.user?._id, enrollmentStatus: 'active' }),
      maxLoad: m.maxStudentLoad,
    }))
  );

  sendSuccess(res, 200, {
    totalStudents,
    totalMentors,
    totalCounselors,
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
    .populate('department', 'name')
    .populate('assignedMentor', 'name email phone');
  if (!student) throw new ApiError(404, 'Student profile not found.');

  const inputs = await getStudentRiskInputs(student._id);
  const attention = evaluateStudentAttention(inputs);

  await autoFlagOverdueFollowUps({ student: student._id });
  const nextFollowUp = await FollowUp.findOne({ student: student._id, status: 'Pending' }).sort({ dueDate: 1 });

  sendSuccess(res, 200, {
    student,
    academicSummary: { gpa: attention.signals.gpa, arrearCount: attention.signals.arrearCount },
    attendanceSummary: {
      percentage: attention.signals.attendancePercentage,
      status: attention.signals.attendanceStatus,
    },
    nextFollowUp,
  }, 'Student dashboard data fetched.');
});

// GET /api/dashboard/counselor
const getCounselorDashboard = asyncHandler(async (req, res) => {
  const [totalCases, activeCases, scheduledSessions, completedSessions, pendingAppointments, recentSessions] = await Promise.all([
    Intervention.countDocuments({ assignedTo: req.user._id }),
    Intervention.countDocuments({ assignedTo: req.user._id, status: { $in: ['Open', 'In Progress', 'Follow-up'] } }),
    CounselingSession.countDocuments({ conductedBy: req.user._id, status: 'Scheduled' }),
    CounselingSession.countDocuments({ conductedBy: req.user._id, status: 'Completed' }),
    Appointment.countDocuments({ withUser: req.user._id, status: 'Pending' }),
    CounselingSession.find({ conductedBy: req.user._id }).populate('student', 'studentCode').sort({ date: -1 }).limit(8),
  ]);

  sendSuccess(res, 200, {
    totalCases,
    activeCases,
    scheduledSessions,
    completedSessions,
    pendingAppointments,
    recentSessions,
  }, 'Counselor dashboard data fetched.');
});

module.exports = { getMentorDashboard, getAdminDashboard, getStudentDashboard, getCounselorDashboard };
