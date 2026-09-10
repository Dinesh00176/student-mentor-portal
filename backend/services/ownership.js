const ApiError = require('../utils/ApiError');
const Student = require('../models/Student');
const Intervention = require('../models/Intervention');
const CounselingSession = require('../models/CounselingSession');
const Appointment = require('../models/Appointment');

/**
 * Checks if a counselor is authorized for a student:
 * Must have an active/assigned intervention, counseling session, or appointment.
 */
async function assertCounselorAuthorizedForStudent(user, studentId) {
  if (user.role !== 'counselor') return;

  const [hasIntervention, hasSession, hasAppt] = await Promise.all([
    Intervention.exists({ student: studentId, assignedTo: user._id }),
    CounselingSession.exists({ student: studentId, conductedBy: user._id }),
    Appointment.exists({ student: studentId, withUser: user._id }),
  ]);

  if (!hasIntervention && !hasSession && !hasAppt) {
    throw new ApiError(403, 'Access denied: You do not have an active or assigned counseling case for this student.');
  }
}

/**
 * Asserts a user has permission to read a student's record and academic data.
 * - Admin: Full read access.
 * - Mentor: Assigned mentees only.
 * - Counselor: Authorized counseling cases only.
 * - Student: Self record only.
 */
async function assertCanAccessStudent(user, studentId) {
  const student = await Student.findById(studentId);
  if (!student) throw new ApiError(404, 'Student not found.');

  if (user.role === 'admin') return student;

  if (user.role === 'student') {
    const studentUserId = student.user?._id || student.user;
    if (!studentUserId || String(studentUserId) !== String(user._id)) {
      throw new ApiError(403, 'You may only access your own records.');
    }
    return student;
  }

  if (user.role === 'mentor') {
    const assignedMentorId = student.assignedMentor?._id || student.assignedMentor;
    if (!assignedMentorId || String(assignedMentorId) !== String(user._id)) {
      throw new ApiError(403, 'You are not the assigned mentor for this student.');
    }
    return student;
  }

  if (user.role === 'counselor') {
    await assertCounselorAuthorizedForStudent(user, student._id);
    return student;
  }

  throw new ApiError(403, 'Unauthorized access.');
}

/**
 * Asserts a user has permission to modify a student's record.
 * - Admin: Full modification rights.
 * - Mentor: Assigned mentees only.
 * - Other roles: Forbidden.
 */
async function assertCanModifyStudent(user, studentId) {
  const student = await Student.findById(studentId);
  if (!student) throw new ApiError(404, 'Student not found.');

  if (user.role === 'admin') return student;

  if (user.role === 'mentor') {
    const assignedMentorId = student.assignedMentor?._id || student.assignedMentor;
    if (!assignedMentorId || String(assignedMentorId) !== String(user._id)) {
      throw new ApiError(403, 'You are not the assigned mentor for this student.');
    }
    return student;
  }

  throw new ApiError(403, 'Forbidden: You do not have permission to modify this student.');
}

/**
 * Confirms a mentor may act on a given student (admins always allowed).
 * Preserved for backwards compatibility.
 */
async function assertMentorOwnsStudent(user, studentId) {
  if (user.role === 'admin') return;
  if (user.role !== 'mentor') {
    throw new ApiError(403, 'Only mentors or admins may perform this action.');
  }
  const student = await Student.findById(studentId);
  if (!student) throw new ApiError(404, 'Student not found.');
  const assignedMentorId = student.assignedMentor?._id || student.assignedMentor;
  if (!assignedMentorId || String(assignedMentorId) !== String(user._id)) {
    throw new ApiError(403, 'You are not the assigned mentor for this student.');
  }
}

/**
 * Confirms a student user may view their own record only.
 */
function assertSelf(user, studentUserId) {
  if (user.role === 'admin') return;
  if (user.role === 'student') {
    if (String(studentUserId) !== String(user._id)) {
      throw new ApiError(403, 'You may only access your own records.');
    }
  }
}

module.exports = {
  assertCounselorAuthorizedForStudent,
  assertCanAccessStudent,
  assertCanModifyStudent,
  assertMentorOwnsStudent,
  assertSelf,
};
