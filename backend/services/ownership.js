const ApiError = require('../utils/ApiError');
const Student = require('../models/Student');

// Confirms a mentor may act on a given student (admins always allowed).
async function assertMentorOwnsStudent(user, studentId) {
  if (user.role === 'admin') return;
  if (user.role !== 'mentor') {
    throw new ApiError(403, 'Only mentors or admins may perform this action.');
  }
  const student = await Student.findById(studentId);
  if (!student) throw new ApiError(404, 'Student not found.');
  if (!student.assignedMentor || String(student.assignedMentor) !== String(user._id)) {
    throw new ApiError(403, 'You are not the assigned mentor for this student.');
  }
}

// Confirms a student user may view their own record only.
function assertSelf(user, studentUserId) {
  if (user.role === 'admin' || user.role === 'mentor' || user.role === 'counselor') return;
  if (String(studentUserId) !== String(user._id)) {
    throw new ApiError(403, 'You may only access your own records.');
  }
}

module.exports = { assertMentorOwnsStudent, assertSelf };
