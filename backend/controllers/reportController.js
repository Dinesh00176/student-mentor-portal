const asyncHandler = require('../utils/asyncHandler');
const { sendReport } = require('../utils/csv');
const Student = require('../models/Student');
const Mentor = require('../models/Mentor');
const CounselingSession = require('../models/CounselingSession');
const Intervention = require('../models/Intervention');
const { summarizeAttendance } = require('../services/attendanceCalculator');
const { computeSemesterGPA } = require('../services/gpaCalculator');
const { evaluateStudentAttention } = require('../services/attentionEngine');
const { getStudentRiskInputs } = require('../services/studentDataAggregator');
const AttendanceRecord = require('../models/AttendanceRecord');
const AcademicRecord = require('../models/AcademicRecord');

function buildStudentFilter({ department, year, mentor }) {
  const filter = { enrollmentStatus: 'active' };
  if (department) filter.department = department;
  if (year) filter.year = Number(year);
  if (mentor) filter.assignedMentor = mentor;
  return filter;
}

// GET /api/reports/attendance-concerns?department=&year=&mentor=&export=csv
const attendanceConcernsReport = asyncHandler(async (req, res) => {
  const { department, year, mentor } = req.query;
  const students = await Student.find(buildStudentFilter({ department, year, mentor })).populate('department', 'name');
  const results = [];
  for (const s of students) { // eslint-disable-line no-restricted-syntax
    const records = await AttendanceRecord.find({ student: s._id, semester: s.semester }); // eslint-disable-line no-await-in-loop
    const summary = summarizeAttendance(records);
    if (summary.status !== 'Healthy' && records.length > 0) {
      results.push({ student: s.studentCode, department: s.department?.name, ...summary });
    }
  }
  sendReport(req, res, 'attendance-concerns.csv', results, [
    { label: 'Student', value: 'student' },
    { label: 'Department', value: 'department' },
    { label: 'Percentage', value: 'percentage' },
    { label: 'Status', value: 'status' },
  ], results, 'Attendance concerns report generated.');
});

// GET /api/reports/academic-concerns?department=&year=&mentor=&export=csv
const academicConcernsReport = asyncHandler(async (req, res) => {
  const { department, year, mentor } = req.query;
  const students = await Student.find(buildStudentFilter({ department, year, mentor })).populate('department', 'name');
  const results = [];
  for (const s of students) { // eslint-disable-line no-restricted-syntax
    const records = await AcademicRecord.find({ student: s._id, semester: s.semester }); // eslint-disable-line no-await-in-loop
    const gpa = computeSemesterGPA(records);
    const arrears = records.filter((r) => r.isArrear).length;
    if ((gpa !== null && gpa < 5.5) || arrears > 0) {
      results.push({ student: s.studentCode, department: s.department?.name, gpa, arrears });
    }
  }
  sendReport(req, res, 'academic-concerns.csv', results, [
    { label: 'Student', value: 'student' },
    { label: 'Department', value: 'department' },
    { label: 'GPA', value: 'gpa' },
    { label: 'Arrears', value: 'arrears' },
  ], results, 'Academic concerns report generated.');
});

// GET /api/reports/counseling-activity?status=&from=&to=&export=csv
const counselingActivityReport = asyncHandler(async (req, res) => {
  const { status, from, to } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const sessions = await CounselingSession.find(filter)
    .populate('student', 'studentCode')
    .populate('conductedBy', 'name role')
    .sort({ date: -1 })
    .limit(500);
  const byStatus = {};
  sessions.forEach((s) => { byStatus[s.status] = (byStatus[s.status] || 0) + 1; });

  const rows = sessions.map((s) => ({
    student: s.student?.studentCode, conductedBy: s.conductedBy?.name, date: s.date, sessionType: s.sessionType, status: s.status,
  }));
  sendReport(req, res, 'counseling-activity.csv', rows, [
    { label: 'Student', value: 'student' },
    { label: 'Conducted By', value: 'conductedBy' },
    { label: 'Date', value: (r) => new Date(r.date).toISOString() },
    { label: 'Type', value: 'sessionType' },
    { label: 'Status', value: 'status' },
  ], { sessions, byStatus }, 'Counseling activity report generated.');
});

// GET /api/reports/intervention-status?status=&export=csv
const interventionStatusReport = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const interventions = await Intervention.find(filter).populate('student', 'studentCode').populate('assignedTo', 'name');
  const byStatus = {};
  interventions.forEach((i) => { byStatus[i.status] = (byStatus[i.status] || 0) + 1; });

  const rows = interventions.map((i) => ({
    student: i.student?.studentCode, assignedTo: i.assignedTo?.name, type: i.interventionType, status: i.status,
  }));
  sendReport(req, res, 'intervention-status.csv', rows, [
    { label: 'Student', value: 'student' },
    { label: 'Assigned To', value: 'assignedTo' },
    { label: 'Type', value: 'type' },
    { label: 'Status', value: 'status' },
  ], { interventions, byStatus }, 'Intervention status report generated.');
});

// GET /api/reports/mentor-workload?export=csv
const mentorWorkloadReport = asyncHandler(async (req, res) => {
  const mentors = await Mentor.find().populate('user', 'name email');
  const results = await Promise.all(
    mentors.map(async (m) => ({
      mentor: m.user?.name,
      email: m.user?.email,
      currentLoad: await Student.countDocuments({ assignedMentor: m.user?._id, enrollmentStatus: 'active' }),
      maxLoad: m.maxStudentLoad,
    }))
  );
  sendReport(req, res, 'mentor-workload.csv', results, [
    { label: 'Mentor', value: 'mentor' },
    { label: 'Email', value: 'email' },
    { label: 'Current Load', value: 'currentLoad' },
    { label: 'Max Load', value: 'maxLoad' },
  ], results, 'Mentor workload report generated.');
});

// GET /api/reports/students-needing-attention?priority=&export=csv
// New report satisfying "Students Needing Attention" / "High Priority Students".
const attentionReport = asyncHandler(async (req, res) => {
  const { priority, department, year, mentor } = req.query;
  const students = await Student.find(buildStudentFilter({ department, year, mentor })).populate('department', 'name');

  const results = [];
  for (const s of students) { // eslint-disable-line no-restricted-syntax
    const inputs = await getStudentRiskInputs(s._id); // eslint-disable-line no-await-in-loop
    if (!inputs) continue; // eslint-disable-line no-continue
    const attention = evaluateStudentAttention(inputs);
    if (attention.status === 'Stable') continue; // eslint-disable-line no-continue
    if (priority && attention.status !== priority) continue; // eslint-disable-line no-continue
    results.push({
      student: s.studentCode, department: s.department?.name, status: attention.status, reasons: attention.reasons.join(' | '),
    });
  }

  sendReport(req, res, 'students-needing-attention.csv', results, [
    { label: 'Student', value: 'student' },
    { label: 'Department', value: 'department' },
    { label: 'Status', value: 'status' },
    { label: 'Reasons', value: 'reasons' },
  ], results, 'Students needing attention report generated.');
});

module.exports = {
  attendanceConcernsReport,
  academicConcernsReport,
  counselingActivityReport,
  interventionStatusReport,
  mentorWorkloadReport,
  attentionReport,
};
