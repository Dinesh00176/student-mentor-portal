// Central place that pulls the records the attention engine (and dashboards) need
// for a given student, so controllers stay thin and consistent.
const AcademicRecord = require('../models/AcademicRecord');
const AttendanceRecord = require('../models/AttendanceRecord');
const Intervention = require('../models/Intervention');
const FollowUp = require('../models/FollowUp');
const Student = require('../models/Student');

async function getStudentRiskInputs(studentId) {
  const student = await Student.findById(studentId);
  if (!student) return null;

  const [academicRecords, attendanceRecords, interventions, followUps] = await Promise.all([
    AcademicRecord.find({ student: studentId, semester: student.semester }),
    AttendanceRecord.find({ student: studentId, semester: student.semester }),
    Intervention.find({ student: studentId }),
    FollowUp.find({ student: studentId }),
  ]);

  return { student, academicRecords, attendanceRecords, interventions, followUps };
}

module.exports = { getStudentRiskInputs };
