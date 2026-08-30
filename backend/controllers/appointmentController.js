const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const Appointment = require('../models/Appointment');
const Student = require('../models/Student');
const User = require('../models/User');
const { notify } = require('../services/notify.service');
const { logAudit } = require('../services/auditLog.service');

// GET /api/appointments - scoped by role:
//   student  -> their own requests
//   mentor/counselor -> requests addressed to them
//   admin -> all
const listAppointments = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;

  if (req.user.role === 'student') {
    const me = await Student.findOne({ user: req.user._id });
    if (!me) throw new ApiError(404, 'Student profile not found.');
    filter.student = me._id;
  } else if (req.user.role === 'mentor' || req.user.role === 'counselor') {
    filter.withUser = req.user._id;
  }

  const appointments = await Appointment.find(filter)
    .populate('student', 'studentCode')
    .populate('requestedBy', 'name role')
    .populate('withUser', 'name role')
    .sort({ preferredDate: 1 });

  sendSuccess(res, 200, appointments, 'Appointments fetched.');
});

// POST /api/appointments (student only) - request a meeting with their own mentor,
// or with a counselor.
const createAppointment = asyncHandler(async (req, res) => {
  const { withUser, reason, preferredDate } = req.body;

  const me = await Student.findOne({ user: req.user._id });
  if (!me) throw new ApiError(404, 'Student profile not found.');

  const recipient = await User.findById(withUser);
  if (!recipient || !['mentor', 'counselor'].includes(recipient.role) || recipient.status !== 'active') {
    throw new ApiError(400, 'You can only request a meeting with an active mentor or counselor.');
  }
  if (recipient.role === 'mentor' && String(me.assignedMentor) !== String(recipient._id)) {
    throw new ApiError(403, 'You may only request meetings with your assigned mentor.');
  }
  if (new Date(preferredDate) < new Date()) {
    throw new ApiError(400, 'Preferred date must be in the future.');
  }

  const appointment = await Appointment.create({
    student: me._id, requestedBy: req.user._id, withUser, reason, preferredDate,
  });

  await notify({
    user: withUser, type: 'General', relatedStudent: me._id,
    message: `${req.user.name} requested a meeting: ${reason}`,
  });

  const populated = await appointment.populate([
    { path: 'student', select: 'studentCode' },
    { path: 'withUser', select: 'name role' },
  ]);
  sendSuccess(res, 201, populated, 'Meeting request sent.');
});

// PATCH /api/appointments/:id/status (mentor/counselor/admin) - accept/reject/reschedule/complete
const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status, confirmedDate, notes } = req.body;
  const validStatuses = ['Confirmed', 'Completed', 'Cancelled', 'Rejected'];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, `status must be one of: ${validStatuses.join(', ')}`);
  }

  const appointment = await Appointment.findById(req.params.id).populate('student', 'user studentCode');
  if (!appointment) throw new ApiError(404, 'Appointment not found.');

  if (req.user.role !== 'admin' && String(appointment.withUser) !== String(req.user._id)) {
    throw new ApiError(403, 'You may only manage appointments addressed to you.');
  }

  appointment.status = status;
  if (confirmedDate) appointment.confirmedDate = confirmedDate;
  if (notes) appointment.notes = notes;
  await appointment.save();

  await logAudit({
    actor: req.user, action: 'AppointmentStatusChanged', targetType: 'Appointment', targetId: appointment._id,
    details: `status -> ${status}`,
  });

  const studentUserId = appointment.student?.user;
  if (studentUserId) {
    await notify({
      user: studentUserId, type: 'General', relatedStudent: appointment.student._id,
      message: `Your meeting request was marked "${status}".`,
    });
  }

  sendSuccess(res, 200, appointment, 'Appointment updated.');
});

module.exports = { listAppointments, createAppointment, updateAppointmentStatus };
