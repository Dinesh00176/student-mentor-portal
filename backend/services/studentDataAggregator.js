// Central place that pulls the records the attention engine (and dashboards) need
// for a given student or batch of students, so controllers stay thin, fast, and consistent.
const AcademicRecord = require('../models/AcademicRecord');
const AttendanceRecord = require('../models/AttendanceRecord');
const Intervention = require('../models/Intervention');
const FollowUp = require('../models/FollowUp');
const Student = require('../models/Student');

async function getStudentRiskInputs(studentId) {
  const student = await Student.findById(studentId);
  if (!student) return null;

  let [academicRecords, attendanceRecords, interventions, followUps] = await Promise.all([
    AcademicRecord.find({ student: studentId, semester: student.semester }),
    AttendanceRecord.find({ student: studentId, semester: student.semester }),
    Intervention.find({ student: studentId }),
    FollowUp.find({ student: studentId }),
  ]);

  if (academicRecords.length === 0) {
    const latestAcademic = await AcademicRecord.findOne({ student: studentId }).sort({ semester: -1 });
    if (latestAcademic) {
      academicRecords = await AcademicRecord.find({ student: studentId, semester: latestAcademic.semester });
    }
  }

  if (attendanceRecords.length === 0) {
    const latestAttendance = await AttendanceRecord.findOne({ student: studentId }).sort({ semester: -1 });
    if (latestAttendance) {
      attendanceRecords = await AttendanceRecord.find({ student: studentId, semester: latestAttendance.semester });
    }
  }

  return { student, academicRecords, attendanceRecords, interventions, followUps };
}

/**
 * Batch version that retrieves risk inputs for an array of student IDs in 4 parallel queries,
 * completely eliminating N+1 database round trips.
 * @param {Array<string|ObjectId>} studentIds
 * @returns {Promise<Map<string, { student: Object, academicRecords: Array, attendanceRecords: Array, interventions: Array, followUps: Array }>>}
 */
async function batchStudentRiskInputs(studentIds) {
  if (!studentIds || studentIds.length === 0) return new Map();

  const students = await Student.find({ _id: { $in: studentIds } });
  if (students.length === 0) return new Map();

  const [allAcademics, allAttendance, allInterventions, allFollowUps] = await Promise.all([
    AcademicRecord.find({ student: { $in: studentIds } }).lean(),
    AttendanceRecord.find({ student: { $in: studentIds } }).lean(),
    Intervention.find({ student: { $in: studentIds } }).lean(),
    FollowUp.find({ student: { $in: studentIds } }).lean(),
  ]);

  const academicsByStudent = new Map();
  for (const rec of allAcademics) {
    const sId = String(rec.student);
    if (!academicsByStudent.has(sId)) academicsByStudent.set(sId, []);
    academicsByStudent.get(sId).push(rec);
  }

  const attendanceByStudent = new Map();
  for (const rec of allAttendance) {
    const sId = String(rec.student);
    if (!attendanceByStudent.has(sId)) attendanceByStudent.set(sId, []);
    attendanceByStudent.get(sId).push(rec);
  }

  const interventionsByStudent = new Map();
  for (const rec of allInterventions) {
    const sId = String(rec.student);
    if (!interventionsByStudent.has(sId)) interventionsByStudent.set(sId, []);
    interventionsByStudent.get(sId).push(rec);
  }

  const followUpsByStudent = new Map();
  for (const rec of allFollowUps) {
    const sId = String(rec.student);
    if (!followUpsByStudent.has(sId)) followUpsByStudent.set(sId, []);
    followUpsByStudent.get(sId).push(rec);
  }

  const resultsMap = new Map();

  for (const student of students) {
    const sId = String(student._id);
    const rawAcademics = academicsByStudent.get(sId) || [];
    const rawAttendance = attendanceByStudent.get(sId) || [];

    // Filter by student's current semester, with fallback to latest available semester
    let academicRecords = rawAcademics.filter((r) => Number(r.semester) === Number(student.semester));
    if (academicRecords.length === 0 && rawAcademics.length > 0) {
      const maxSem = Math.max(...rawAcademics.map((r) => Number(r.semester) || 0));
      academicRecords = rawAcademics.filter((r) => Number(r.semester) === maxSem);
    }

    let attendanceRecords = rawAttendance.filter((r) => Number(r.semester) === Number(student.semester));
    if (attendanceRecords.length === 0 && rawAttendance.length > 0) {
      const maxSem = Math.max(...rawAttendance.map((r) => Number(r.semester) || 0));
      attendanceRecords = rawAttendance.filter((r) => Number(r.semester) === maxSem);
    }

    resultsMap.set(sId, {
      student,
      academicRecords,
      attendanceRecords,
      interventions: interventionsByStudent.get(sId) || [],
      followUps: followUpsByStudent.get(sId) || [],
    });
  }

  return resultsMap;
}

module.exports = { getStudentRiskInputs, batchStudentRiskInputs };
