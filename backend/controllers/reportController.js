const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const { sendReport } = require('../utils/csv');
const Student = require('../models/Student');
const Mentor = require('../models/Mentor');
const CounselingSession = require('../models/CounselingSession');
const Intervention = require('../models/Intervention');
const Department = require('../models/Department');
const User = require('../models/User');
const { summarizeAttendance } = require('../services/attendanceCalculator');
const { computeSemesterGPA } = require('../services/gpaCalculator');
const { evaluateStudentAttention } = require('../services/attentionEngine');
const { getStudentRiskInputs, batchStudentRiskInputs } = require('../services/studentDataAggregator');
const AttendanceRecord = require('../models/AttendanceRecord');
const AcademicRecord = require('../models/AcademicRecord');

async function buildStudentFilter({ department, year, mentor, semester, status }) {
  const filter = {};
  if (status && status !== 'undefined' && status !== 'null' && status !== 'all') {
    filter.enrollmentStatus = status;
  } else {
    filter.enrollmentStatus = 'active';
  }

  if (department && department !== 'undefined' && department !== 'null' && department !== 'all') {
    if (mongoose.Types.ObjectId.isValid(department)) {
      filter.department = department;
    } else {
      const deptDoc = await Department.findOne({
        $or: [{ code: String(department).toUpperCase() }, { name: department }],
      });
      if (deptDoc) {
        filter.department = deptDoc._id;
      } else {
        filter.department = department;
      }
    }
  }

  if (year && !isNaN(Number(year)) && Number(year) > 0) {
    filter.year = Number(year);
  }

  if (semester && !isNaN(Number(semester)) && Number(semester) > 0) {
    filter.semester = Number(semester);
  }

  if (mentor && mentor !== 'undefined' && mentor !== 'null' && mentor !== 'all') {
    if (mongoose.Types.ObjectId.isValid(mentor)) {
      const mentorDoc = await Mentor.findById(mentor);
      if (mentorDoc) {
        filter.assignedMentor = mentorDoc.user;
      } else {
        filter.assignedMentor = mentor;
      }
    } else {
      filter.assignedMentor = mentor;
    }
  }

  return filter;
}

// GET /api/reports/attendance-concerns?department=&year=&mentor=&semester=&status=&export=csv
const attendanceConcernsReport = asyncHandler(async (req, res) => {
  const { department, year, mentor, semester, status } = req.query;
  const studentFilter = await buildStudentFilter({ department, year, mentor, semester });
  const students = await Student.find(studentFilter)
    .populate('department', 'name code')
    .populate('user', 'name email')
    .populate('assignedMentor', 'name email');

  const rows = [];
  const byStatus = { Critical: 0, 'Attention Required': 0 };

  for (const s of students) { // eslint-disable-line no-restricted-syntax
    const sem = semester ? Number(semester) : s.semester;
    let records = await AttendanceRecord.find({ student: s._id, semester: sem }); // eslint-disable-line no-await-in-loop
    if (records.length === 0 && !semester) {
      const latest = await AttendanceRecord.findOne({ student: s._id }).sort({ semester: -1 }); // eslint-disable-line no-await-in-loop
      if (latest) {
        records = await AttendanceRecord.find({ student: s._id, semester: latest.semester }); // eslint-disable-line no-await-in-loop
      }
    }
    const summary = summarizeAttendance(records);
    if (summary.status !== 'Healthy' && records.length > 0) {
      if (status && status !== 'all' && status !== 'undefined' && summary.status !== status) {
        continue; // eslint-disable-line no-continue
      }
      if (byStatus[summary.status] !== undefined) byStatus[summary.status] += 1;

      rows.push({
        _id: s._id,
        studentId: s.studentCode,
        student: s.studentCode,
        studentName: s.user?.name || s.studentCode,
        department: s.department?.name || '—',
        year: s.year,
        semester: sem,
        mentor: s.assignedMentor?.name || 'Unassigned',
        percentage: summary.percentage ?? 0,
        attendancePercentage: summary.percentage ?? 0,
        totalClasses: summary.totalClasses ?? 0,
        attendedClasses: summary.attendedClasses ?? 0,
        status: summary.status,
      });
    }
  }

  const payload = {
    rows,
    summary: { total: rows.length, byStatus },
    results: rows,
    byStatus,
  };

  sendReport(req, res, 'attendance-concerns.csv', rows, [
    { label: 'Student ID', value: 'studentId' },
    { label: 'Student Name', value: 'studentName' },
    { label: 'Department', value: 'department' },
    { label: 'Year', value: 'year' },
    { label: 'Semester', value: 'semester' },
    { label: 'Mentor', value: 'mentor' },
    { label: 'Attendance %', value: (r) => `${r.percentage}%` },
    { label: 'Status', value: 'status' },
  ], payload, 'Attendance concerns report generated.');
});

// GET /api/reports/academic-concerns?department=&year=&mentor=&semester=&status=&export=csv
const academicConcernsReport = asyncHandler(async (req, res) => {
  const { department, year, mentor, semester, status } = req.query;
  const studentFilter = await buildStudentFilter({ department, year, mentor, semester });
  const students = await Student.find(studentFilter)
    .populate('department', 'name code')
    .populate('user', 'name email')
    .populate('assignedMentor', 'name email');

  const rows = [];
  const byStatus = { Critical: 0, 'Needs Attention': 0 };

  for (const s of students) { // eslint-disable-line no-restricted-syntax
    const sem = semester ? Number(semester) : s.semester;
    let records = await AcademicRecord.find({ student: s._id, semester: sem }); // eslint-disable-line no-await-in-loop
    if (records.length === 0 && !semester) {
      const latest = await AcademicRecord.findOne({ student: s._id }).sort({ semester: -1 }); // eslint-disable-line no-await-in-loop
      if (latest) {
        records = await AcademicRecord.find({ student: s._id, semester: latest.semester }); // eslint-disable-line no-await-in-loop
      }
    }
    const gpa = computeSemesterGPA(records);
    const arrears = records.filter((r) => r.isArrear).length;

    if ((gpa !== null && gpa < 6.0) || arrears > 0) {
      const academicStatus = arrears > 0 ? 'Critical' : (gpa !== null && gpa < 6.0) ? 'Needs Attention' : 'Good Standing';
      if (status && status !== 'all' && status !== 'undefined' && academicStatus !== status) {
        continue; // eslint-disable-line no-continue
      }
      if (byStatus[academicStatus] !== undefined) byStatus[academicStatus] += 1;

      rows.push({
        _id: s._id,
        studentId: s.studentCode,
        student: s.studentCode,
        studentName: s.user?.name || s.studentCode,
        department: s.department?.name || '—',
        mentor: s.assignedMentor?.name || 'Unassigned',
        gpa: gpa ?? '—',
        arrears,
        academicStatus,
      });
    }
  }

  const payload = {
    rows,
    summary: { total: rows.length, byStatus },
    results: rows,
    byStatus,
  };

  sendReport(req, res, 'academic-concerns.csv', rows, [
    { label: 'Student ID', value: 'studentId' },
    { label: 'Student Name', value: 'studentName' },
    { label: 'Department', value: 'department' },
    { label: 'Mentor', value: 'mentor' },
    { label: 'GPA', value: 'gpa' },
    { label: 'Arrears', value: 'arrears' },
    { label: 'Academic Status', value: 'academicStatus' },
  ], payload, 'Academic concerns report generated.');
});

// GET /api/reports/counseling-activity?status=&counselor=&from=&to=&export=csv
const counselingActivityReport = asyncHandler(async (req, res) => {
  const { status, counselor, from, to } = req.query;
  const filter = {};
  if (status && status !== 'undefined' && status !== 'null' && status !== 'all') filter.status = status;
  if (counselor && counselor !== 'undefined' && counselor !== 'null' && counselor !== 'all') {
    filter.conductedBy = counselor;
  }
  if (from || to) {
    filter.date = {};
    if (from && from !== 'undefined' && !isNaN(new Date(from).getTime())) filter.date.$gte = new Date(from);
    if (to && to !== 'undefined' && !isNaN(new Date(to).getTime())) filter.date.$lte = new Date(to);
    if (Object.keys(filter.date).length === 0) delete filter.date;
  }

  const sessions = await CounselingSession.find(filter)
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
    .limit(500);

  const byStatus = {};
  sessions.forEach((s) => { byStatus[s.status] = (byStatus[s.status] || 0) + 1; });

  const rows = sessions.map((s) => ({
    _id: s._id,
    student: s.student?.studentCode || '—',
    studentId: s.student?.studentCode || '—',
    studentName: s.student?.user?.name || s.student?.studentCode || '—',
    conductedBy: s.conductedBy?.name || 'Counselor',
    counselor: s.conductedBy?.name || 'Counselor',
    date: s.date,
    sessionType: s.sessionType || 'General',
    status: s.status,
    reason: s.reason || '—',
  }));

  const payload = {
    rows,
    summary: { total: rows.length, byStatus },
    sessions: rows,
    results: rows,
    byStatus,
  };

  sendReport(req, res, 'counseling-activity.csv', rows, [
    { label: 'Student ID', value: 'student' },
    { label: 'Student Name', value: 'studentName' },
    { label: 'Counselor', value: 'conductedBy' },
    { label: 'Date', value: (r) => (r.date ? new Date(r.date).toISOString().split('T')[0] : '') },
    { label: 'Session Type', value: 'sessionType' },
    { label: 'Status', value: 'status' },
  ], payload, 'Counseling activity report generated.');
});

// GET /api/reports/intervention-status?status=&assignedTo=&interventionType=&export=csv
const interventionStatusReport = asyncHandler(async (req, res) => {
  const { status, assignedTo, interventionType } = req.query;
  const filter = {};
  if (status && status !== 'undefined' && status !== 'null' && status !== 'all') filter.status = status;
  if (assignedTo && assignedTo !== 'undefined' && assignedTo !== 'null' && assignedTo !== 'all') filter.assignedTo = assignedTo;
  if (interventionType && interventionType !== 'all' && interventionType !== 'undefined') {
    filter.interventionType = interventionType;
  }

  const interventions = await Intervention.find(filter)
    .populate({
      path: 'student',
      select: 'studentCode department user',
      populate: [
        { path: 'user', select: 'name email' },
        { path: 'department', select: 'name code' },
      ],
    })
    .populate('assignedTo', 'name role email')
    .sort({ createdAt: -1 });

  const byStatus = {};
  interventions.forEach((i) => { byStatus[i.status] = (byStatus[i.status] || 0) + 1; });

  const rows = interventions.map((i) => ({
    _id: i._id,
    student: i.student?.studentCode || '—',
    studentId: i.student?.studentCode || '—',
    studentName: i.student?.user?.name || i.student?.studentCode || '—',
    assignedTo: i.assignedTo?.name || 'Mentor',
    assignedRole: i.assignedTo?.role || 'mentor',
    interventionType: i.interventionType || 'Academic Support',
    type: i.interventionType || 'Academic Support',
    status: i.status,
    followUpDate: i.followUpDate,
    problemIdentified: i.problemIdentified || '—',
  }));

  const payload = {
    rows,
    summary: { total: rows.length, byStatus },
    interventions: rows,
    results: rows,
    byStatus,
  };

  sendReport(req, res, 'intervention-status.csv', rows, [
    { label: 'Student ID', value: 'student' },
    { label: 'Student Name', value: 'studentName' },
    { label: 'Intervention Type', value: (r) => r.interventionType || r.type },
    { label: 'Assigned To', value: 'assignedTo' },
    { label: 'Assigned Role', value: 'assignedRole' },
    { label: 'Status', value: 'status' },
    { label: 'Follow-up Date', value: (r) => (r.followUpDate ? new Date(r.followUpDate).toISOString().split('T')[0] : '') },
  ], payload, 'Intervention status report generated.');
});

// GET /api/reports/mentor-workload?department=&status=&export=csv
const mentorWorkloadReport = asyncHandler(async (req, res) => {
  const { department, status } = req.query;
  const filter = {};
  if (department && department !== 'all' && department !== 'undefined') {
    if (mongoose.Types.ObjectId.isValid(department)) {
      filter.department = department;
    } else {
      const deptDoc = await Department.findOne({
        $or: [{ code: String(department).toUpperCase() }, { name: department }],
      });
      if (deptDoc) filter.department = deptDoc._id;
    }
  }

  const mentors = await Mentor.find(filter)
    .populate('user', 'name email status')
    .populate('department', 'name code');

  const rows = [];
  const byStatus = { Normal: 0, Full: 0, Overloaded: 0 };

  for (const m of mentors) { // eslint-disable-line no-restricted-syntax
    const currentLoad = await Student.countDocuments({ assignedMentor: m.user?._id, enrollmentStatus: 'active' }); // eslint-disable-line no-await-in-loop
    const maxCapacity = m.maxStudentLoad || 25;
    const remainingCapacity = Math.max(0, maxCapacity - currentLoad);
    const utilization = Math.round((currentLoad / maxCapacity) * 100);
    const workloadStatus = currentLoad > maxCapacity ? 'Overloaded' : currentLoad === maxCapacity ? 'Full' : 'Normal';

    if (status && status !== 'all' && status !== 'undefined' && workloadStatus !== status) {
      continue; // eslint-disable-line no-continue
    }
    if (byStatus[workloadStatus] !== undefined) byStatus[workloadStatus] += 1;

    rows.push({
      _id: m._id,
      mentor: m.user?.name || 'Faculty Mentor',
      email: m.user?.email || '—',
      department: m.department?.name || '—',
      currentLoad,
      maxCapacity,
      maxLoad: maxCapacity,
      capacity: maxCapacity,
      remainingCapacity,
      utilization,
      status: workloadStatus,
    });
  }

  const payload = {
    rows,
    summary: { total: rows.length, byStatus },
    results: rows,
    byStatus,
  };

  sendReport(req, res, 'mentor-workload.csv', rows, [
    { label: 'Mentor', value: 'mentor' },
    { label: 'Email', value: 'email' },
    { label: 'Department', value: 'department' },
    { label: 'Current Load', value: 'currentLoad' },
    { label: 'Maximum Capacity', value: 'maxCapacity' },
    { label: 'Remaining Capacity', value: 'remainingCapacity' },
    { label: 'Utilization %', value: (r) => `${r.utilization}%` },
    { label: 'Status', value: 'status' },
  ], payload, 'Mentor workload report generated.');
});

// GET /api/reports/students-needing-attention?priority=&department=&year=&semester=&mentor=&status=&export=csv
const attentionReport = asyncHandler(async (req, res) => {
  const { priority, department, year, semester, mentor, status } = req.query;
  const studentFilter = await buildStudentFilter({ department, year, mentor, semester, status });
  const students = await Student.find(studentFilter)
    .populate('department', 'name code')
    .populate('user', 'name email')
    .populate('assignedMentor', 'name email');

  const rows = [];
  const byStatus = { 'High Priority': 0, 'Needs Attention': 0 };

  const inputsMap = await batchStudentRiskInputs(students.map((s) => s._id));

  for (const s of students) {
    const inputs = inputsMap.get(String(s._id));
    if (!inputs) continue;
    const attention = evaluateStudentAttention(inputs);
    if (attention.status === 'Stable') continue;
    if (priority && priority !== 'undefined' && priority !== 'null' && priority !== 'all' && attention.status !== priority) {
      continue;
    }

    if (byStatus[attention.status] !== undefined) {
      byStatus[attention.status] += 1;
    }

    rows.push({
      _id: s._id,
      studentId: s.studentCode,
      student: s.studentCode,
      studentName: s.user?.name || s.studentCode,
      department: s.department?.name || '—',
      year: s.year,
      semester: s.semester,
      mentor: s.assignedMentor?.name || 'Unassigned',
      attendancePercentage: attention.signals.attendancePercentage ?? 0,
      gpa: attention.signals.gpa ?? '—',
      arrears: attention.signals.arrearCount ?? 0,
      status: attention.status,
      reasons: attention.reasons || [],
    });
  }

  const csvRows = rows.map((r) => ({
    ...r,
    reasons: Array.isArray(r.reasons) ? r.reasons.join(' | ') : r.reasons,
    attendancePercentage: `${r.attendancePercentage}%`,
  }));

  const payload = {
    rows,
    summary: { total: rows.length, byStatus },
    results: rows,
    byStatus,
  };

  sendReport(req, res, 'students-needing-attention.csv', csvRows, [
    { label: 'Student ID', value: 'studentId' },
    { label: 'Student Name', value: 'studentName' },
    { label: 'Department', value: 'department' },
    { label: 'Year', value: 'year' },
    { label: 'Semester', value: 'semester' },
    { label: 'Mentor', value: 'mentor' },
    { label: 'Attendance %', value: 'attendancePercentage' },
    { label: 'GPA', value: 'gpa' },
    { label: 'Arrears', value: 'arrears' },
    { label: 'Status', value: 'status' },
    { label: 'Reasons', value: 'reasons' },
  ], payload, 'Students needing attention report generated.');
});

module.exports = {
  attendanceConcernsReport,
  academicConcernsReport,
  counselingActivityReport,
  interventionStatusReport,
  mentorWorkloadReport,
  attentionReport,
};
