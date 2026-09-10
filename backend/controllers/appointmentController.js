const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const Appointment = require('../models/Appointment');
const Student = require('../models/Student');
const User = require('../models/User');
const { INSTITUTIONAL_RULES } = require('../config/institutionalRules');
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
    .populate({
      path: 'student',
      select: 'studentCode department user',
      populate: [
        { path: 'user', select: 'name email' },
        { path: 'department', select: 'name code' },
      ],
    })
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
  const targetDate = new Date(preferredDate);
  if (targetDate < new Date()) {
    throw new ApiError(400, 'Preferred date must be in the future.');
  }

  // Check conflict with existing confirmed appointments for the recipient
  const windowMs = INSTITUTIONAL_RULES.APPOINTMENTS.CONFLICT_WINDOW_MINUTES * 60 * 1000;
  const conflict = await Appointment.findOne({
    withUser,
    status: 'Confirmed',
    confirmedDate: {
      $gte: new Date(targetDate.getTime() - windowMs),
      $lte: new Date(targetDate.getTime() + windowMs),
    },
  });
  if (conflict) {
    throw new ApiError(409, `The requested faculty already has a confirmed appointment within ${INSTITUTIONAL_RULES.APPOINTMENTS.CONFLICT_WINDOW_MINUTES} minutes of this time slot. Please choose another time.`);
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

// PATCH /api/appointments/:id/status (mentor/counselor/admin, or student cancel)
const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status, confirmedDate, notes } = req.body;

  const appointment = await Appointment.findById(req.params.id).populate('student', 'user studentCode');
  if (!appointment) throw new ApiError(404, 'Appointment not found.');

  const isStudentRequester = req.user.role === 'student' &&
    (String(appointment.requestedBy) === String(req.user._id) || String(appointment.student?.user) === String(req.user._id));

  if (req.user.role !== 'admin' && String(appointment.withUser) !== String(req.user._id)) {
    if (!(status === 'Cancelled' && isStudentRequester)) {
      throw new ApiError(403, 'You may only manage appointments addressed to you.');
    }
  }

  // Enforce controlled appointment state machine
  const currentStatus = appointment.status;
  const allowedTransitions = INSTITUTIONAL_RULES.APPOINTMENTS.VALID_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowedTransitions.includes(status)) {
    throw new ApiError(400, `Invalid status transition: cannot transition appointment from "${currentStatus}" to "${status}".`);
  }

  // Detect schedule conflicts when confirming
  if (status === 'Confirmed' || (confirmedDate && status !== 'Cancelled' && status !== 'Rejected')) {
    const checkDate = new Date(confirmedDate || appointment.confirmedDate || appointment.preferredDate);
    const windowMs = INSTITUTIONAL_RULES.APPOINTMENTS.CONFLICT_WINDOW_MINUTES * 60 * 1000;
    const conflict = await Appointment.findOne({
      _id: { $ne: appointment._id },
      withUser: appointment.withUser,
      status: 'Confirmed',
      confirmedDate: {
        $gte: new Date(checkDate.getTime() - windowMs),
        $lte: new Date(checkDate.getTime() + windowMs),
      },
    });
    if (conflict) {
      throw new ApiError(409, `Schedule conflict: A confirmed appointment already exists within ${INSTITUTIONAL_RULES.APPOINTMENTS.CONFLICT_WINDOW_MINUTES} minutes of this time slot.`);
    }
  }

  appointment.status = status;
  if (confirmedDate) appointment.confirmedDate = confirmedDate;
  if (notes) appointment.notes = notes;
  await appointment.save();

  await logAudit({
    actor: req.user, action: 'AppointmentStatusChanged', targetType: 'Appointment', targetId: appointment._id,
    details: `status: ${currentStatus} -> ${status}`,
  });

  const studentUserId = appointment.student?.user;
  if (studentUserId && String(studentUserId) !== String(req.user._id)) {
    await notify({
      user: studentUserId, type: 'General', relatedStudent: appointment.student._id,
      message: `Your meeting request was marked "${status}".`,
    });
  }

  sendSuccess(res, 200, appointment, 'Appointment updated.');
});

module.exports = { listAppointments, createAppointment, updateAppointmentStatus };
