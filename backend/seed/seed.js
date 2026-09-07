/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Department = require('../models/Department');
const Mentor = require('../models/Mentor');
const Counselor = require('../models/Counselor');
const Student = require('../models/Student');
const AcademicRecord = require('../models/AcademicRecord');
const AttendanceRecord = require('../models/AttendanceRecord');
const CounselingSession = require('../models/CounselingSession');
const MentorRemark = require('../models/MentorRemark');
const Intervention = require('../models/Intervention');
const FollowUp = require('../models/FollowUp');
const Notification = require('../models/Notification');
const Appointment = require('../models/Appointment');
const AuditLog = require('../models/AuditLog');

const MODELS = [
  User, Department, Mentor, Counselor, Student, AcademicRecord, AttendanceRecord,
  CounselingSession, MentorRemark, Intervention, FollowUp, Notification, Appointment, AuditLog,
];

async function clearCollections() {
  await Promise.all(MODELS.map((m) => m.deleteMany({})));
}

async function run() {
  await connectDB();
  await clearCollections();
  console.log('[SEED] Cleared existing collections.');

  // --- Departments ---
  const [cse, ece, mech] = await Department.create([
    { name: 'Computer Science & Engineering', code: 'CSE', description: 'Computer Science & Engineering' },
    { name: 'Electronics & Communication', code: 'ECE', description: 'Electronics & Communication Engineering' },
    { name: 'Mechanical Engineering', code: 'MECH', description: 'Mechanical Engineering' },
  ]);

  // --- Admin ---
  const adminHash = await User.hashPassword('Admin@123');
  const admin = await User.create({
    name: 'Priya Raman', email: 'admin@campus.edu', passwordHash: adminHash, role: 'admin',
  });

  // --- Mentors ---
  const mentorDefs = [
    { name: 'Dr. Arvind Menon', email: 'arvind.mentor@campus.edu', department: cse._id },
    { name: 'Dr. Kavitha Nair', email: 'kavitha.mentor@campus.edu', department: ece._id },
    { name: 'Prof. Suresh Iyer', email: 'suresh.mentor@campus.edu', department: mech._id },
  ];
  const mentorUsers = [];
  for (const m of mentorDefs) {
    const hash = await User.hashPassword('Mentor@123'); // eslint-disable-line no-await-in-loop
    const user = await User.create({ name: m.name, email: m.email, passwordHash: hash, role: 'mentor' }); // eslint-disable-line no-await-in-loop
    await Mentor.create({ user: user._id, department: m.department, designation: 'Faculty Mentor', maxStudentLoad: 20 }); // eslint-disable-line no-await-in-loop
    mentorUsers.push(user);
  }

  // --- Counselors ---
  const counselorHash = await User.hashPassword('Counselor@123');
  const counselorUser = await User.create({
    name: 'Ms. Divya Shankar', email: 'divya.counselor@campus.edu', passwordHash: counselorHash, role: 'counselor',
  });
  await Counselor.create({ user: counselorUser._id, specialization: 'Student Wellbeing', maxCaseLoad: 30 });

  // --- Students ---
  const studentDefs = [
    { name: 'Ananya Subramanian', code: 'CSE2023001', dept: cse._id, mentor: mentorUsers[0]._id, profile: 'stable' },
    { name: 'Rahul Krishnan', code: 'CSE2023002', dept: cse._id, mentor: mentorUsers[0]._id, profile: 'attention' },
    { name: 'Meera Pillai', code: 'CSE2023003', dept: cse._id, mentor: mentorUsers[0]._id, profile: 'high-priority' },
    { name: 'Karthik Balan', code: 'ECE2023001', dept: ece._id, mentor: mentorUsers[1]._id, profile: 'stable' },
    { name: 'Sneha Reddy', code: 'ECE2023002', dept: ece._id, mentor: mentorUsers[1]._id, profile: 'attention' },
    { name: 'Vignesh Rao', code: 'MECH2023001', dept: mech._id, mentor: mentorUsers[2]._id, profile: 'high-priority' },
    { name: 'Divakar Nambiar', code: 'MECH2023002', dept: mech._id, mentor: mentorUsers[2]._id, profile: 'stable' },
  ];

  const students = [];
  for (const s of studentDefs) {
    const hash = await User.hashPassword('Student@123'); // eslint-disable-line no-await-in-loop
    const email = `${s.code.toLowerCase()}@campus.edu`;
    const user = await User.create({ name: s.name, email, passwordHash: hash, role: 'student' }); // eslint-disable-line no-await-in-loop
    const student = await Student.create({ // eslint-disable-line no-await-in-loop
      user: user._id, studentCode: s.code, department: s.dept, year: 2, semester: 3, section: 'A',
      assignedMentor: s.mentor, enrollmentStatus: 'active',
    });
    students.push({ ...s, studentId: student._id, userId: user._id });
  }

  const subjects = ['Data Structures', 'Discrete Mathematics', 'Digital Logic', 'Operating Systems'];

  // Academic + attendance profiles
  for (const s of students) { // eslint-disable-line no-restricted-syntax
    let gradePointBase = 8;
    let arrearChance = 0;
    let attendancePct = 92;
    if (s.profile === 'attention') { gradePointBase = 5.5; attendancePct = 78; }
    if (s.profile === 'high-priority') { gradePointBase = 4; arrearChance = 1; attendancePct = 62; }

    for (let i = 0; i < subjects.length; i += 1) { // eslint-disable-line no-await-in-loop
      const isArrear = i === 0 && arrearChance === 1;
      const gradePoint = isArrear ? 0 : Math.max(gradePointBase + (i % 2 === 0 ? 0.3 : -0.2), 0);
      await AcademicRecord.create({ // eslint-disable-line no-await-in-loop
        student: s.studentId, semester: 3, subject: subjects[i], credits: 4,
        internalMarks: Math.round(gradePoint * 8), examMarks: Math.round(gradePoint * 7),
        grade: isArrear ? 'RA' : gradePoint >= 8 ? 'A' : gradePoint >= 6 ? 'B' : 'C',
        gradePoint, isArrear, remarks: isArrear ? 'Needs to reattempt this subject.' : '',
      });

      const total = 60;
      const attended = Math.round((attendancePct / 100) * total);
      await AttendanceRecord.create({ // eslint-disable-line no-await-in-loop
        student: s.studentId, subject: subjects[i], semester: 3, totalClasses: total, attendedClasses: attended,
      });
    }
  }

  // Counseling, remarks, interventions, follow-ups for attention/high-priority students
  const flagged = students.filter((s) => s.profile !== 'stable');
  for (const s of flagged) { // eslint-disable-line no-restricted-syntax
    await CounselingSession.create({ // eslint-disable-line no-await-in-loop
      student: s.studentId, conductedBy: s.mentor, date: new Date(Date.now() - 7 * 86400000),
      sessionType: 'Academic', reason: 'Discuss recent drop in attendance and marks.',
      discussionSummary: 'Discussed workload and personal circumstances affecting attendance.',
      actionItems: ['Attend remedial classes', 'Weekly check-in with mentor'],
      followUpDate: new Date(Date.now() + 7 * 86400000), status: 'Follow-up Required',
    });

    await MentorRemark.create({ // eslint-disable-line no-await-in-loop
      student: s.studentId, mentor: s.mentor, category: 'Attendance',
      content: 'Attendance has dropped over the last month; monitoring closely.',
    });

    const intervention = await Intervention.create({ // eslint-disable-line no-await-in-loop
      student: s.studentId, problemIdentified: 'Declining attendance and academic performance.',
      interventionType: 'Academic Support', actionTaken: 'Scheduled remedial sessions and mentor check-ins.',
      assignedTo: s.mentor, followUpDate: new Date(Date.now() + 5 * 86400000), status: 'In Progress',
      history: [
        { status: 'Open', changedBy: s.mentor, note: 'Intervention created after mentor review.' },
        { status: 'In Progress', changedBy: s.mentor, note: 'Remedial classes arranged.' },
      ],
    });

    await FollowUp.create({ // eslint-disable-line no-await-in-loop
      student: s.studentId, relatedTo: { type: 'Intervention', refId: intervention._id },
      dueDate: new Date(Date.now() + (s.profile === 'high-priority' ? -2 : 5) * 86400000),
      status: s.profile === 'high-priority' ? 'Overdue' : 'Pending', createdBy: s.mentor,
      notes: 'Check progress on remedial classes.',
    });
  }

  // --- Dedicated Counselor Sessions, Interventions & Appointments (for Ms. Divya Shankar) ---
  const rahulStudent = students.find((s) => s.code === 'CSE2023002');
  const meeraStudent = students.find((s) => s.code === 'CSE2023003');
  const snehaStudent = students.find((s) => s.code === 'ECE2023002');
  const vigneshStudent = students.find((s) => s.code === 'MECH2023001');

  if (meeraStudent) {
    await CounselingSession.create({
      student: meeraStudent.studentId,
      conductedBy: counselorUser._id,
      date: new Date(Date.now() + 2 * 86400000),
      sessionType: 'Personal',
      reason: 'Academic burnout, course anxiety, and stress mitigation strategy.',
      discussionSummary: 'Scheduled proactive session to establish positive study-life balance and mindfulness routines.',
      actionItems: ['Daily 15-minute mindfulness practice', 'Reduce late night study sessions'],
      followUpDate: new Date(Date.now() + 9 * 86400000),
      status: 'Scheduled',
    });

    await Intervention.create({
      student: meeraStudent.studentId,
      problemIdentified: 'Acute stress and exam anxiety impacting academic consistency.',
      interventionType: 'Counseling Referral',
      actionTaken: 'Weekly 1-on-1 guidance sessions and personalized stress management blueprint.',
      assignedTo: counselorUser._id,
      followUpDate: new Date(Date.now() + 7 * 86400000),
      status: 'In Progress',
      history: [
        { status: 'Open', changedBy: counselorUser._id, note: 'Referred by CSE department head.' },
        { status: 'In Progress', changedBy: counselorUser._id, note: 'Active coaching plan initiated.' },
      ],
    });

    await Appointment.create({
      student: meeraStudent.studentId,
      requestedBy: meeraStudent.userId,
      withUser: counselorUser._id,
      reason: 'Follow-up wellness and relaxation strategy check-in.',
      preferredDate: new Date(Date.now() + 4 * 86400000),
      confirmedDate: new Date(Date.now() + 4 * 86400000),
      status: 'Confirmed',
    });
  }

  if (rahulStudent) {
    await CounselingSession.create({
      student: rahulStudent.studentId,
      conductedBy: counselorUser._id,
      date: new Date(Date.now() - 4 * 86400000),
      sessionType: 'Behavioral',
      reason: 'Goal-setting and habit restructuring following attendance drop.',
      discussionSummary: 'Explored time-management bottlenecks and established milestone tracking sheets.',
      actionItems: ['Maintain weekly attendance tracker', 'Check in with faculty mentor every Friday'],
      followUpDate: new Date(Date.now() + 10 * 86400000),
      status: 'Completed',
    });

    await Intervention.create({
      student: rahulStudent.studentId,
      problemIdentified: 'Time allocation conflicts and attendance consistency.',
      interventionType: 'Counseling Referral',
      actionTaken: 'Time-table reorganization and weekly structured check-ins.',
      assignedTo: counselorUser._id,
      followUpDate: new Date(Date.now() + 10 * 86400000),
      status: 'Open',
      history: [
        { status: 'Open', changedBy: counselorUser._id, note: 'Intake interview completed.' },
      ],
    });
  }

  if (snehaStudent) {
    await CounselingSession.create({
      student: snehaStudent.studentId,
      conductedBy: counselorUser._id,
      date: new Date(Date.now() - 10 * 86400000),
      sessionType: 'General',
      reason: 'Mid-semester performance review and self-confidence building.',
      discussionSummary: 'Reviewed subject difficulty perceptions and peer study options.',
      actionItems: ['Joined Department Peer Tutoring Circle'],
      followUpDate: new Date(Date.now() + 14 * 86400000),
      status: 'Completed',
    });

    await Appointment.create({
      student: snehaStudent.studentId,
      requestedBy: snehaStudent.userId,
      withUser: counselorUser._id,
      reason: 'Would like guidance on coping with test anxiety before upcoming exams.',
      preferredDate: new Date(Date.now() + 2 * 86400000),
      status: 'Pending',
    });
  }

  if (vigneshStudent) {
    await CounselingSession.create({
      student: vigneshStudent.studentId,
      conductedBy: counselorUser._id,
      date: new Date(Date.now() - 3 * 86400000),
      sessionType: 'Career',
      reason: 'Career pathway clarification and motivation realignment.',
      discussionSummary: 'Discussed mechanical core opportunities and higher studies options.',
      actionItems: ['Research 3 specialization tracks by next session'],
      followUpDate: new Date(Date.now() + 12 * 86400000),
      status: 'Follow-up Required',
    });
  }

  // Notifications for mentors about their high-priority students
  const highPriority = students.filter((s) => s.profile === 'high-priority');
  for (const s of highPriority) { // eslint-disable-line no-restricted-syntax
    await Notification.create({ // eslint-disable-line no-await-in-loop
      user: s.mentor, type: 'InterventionOverdue',
      message: `Follow-up overdue for ${s.name} (${s.code}).`, relatedStudent: s.studentId,
    });
  }

  // Sample appointment/meeting requests, demonstrating the request -> accept/reject workflow
  const attentionStudent = students.find((s) => s.profile === 'attention');
  if (attentionStudent) {
    await Appointment.create([
      {
        student: attentionStudent.studentId, requestedBy: attentionStudent.userId, withUser: attentionStudent.mentor,
        reason: 'Would like to discuss my course load for next semester.',
        preferredDate: new Date(Date.now() + 3 * 86400000), status: 'Pending',
      },
      {
        student: attentionStudent.studentId, requestedBy: attentionStudent.userId, withUser: attentionStudent.mentor,
        reason: 'Follow-up on remedial class progress.',
        preferredDate: new Date(Date.now() + 10 * 86400000),
        confirmedDate: new Date(Date.now() + 10 * 86400000),
        status: 'Confirmed',
      },
    ]);
  }

  // A few representative audit log entries so the admin audit log view has
  // realistic demo content (in normal operation these are generated by the
  // relevant controllers automatically).
  await AuditLog.create([
    { actor: admin._id, actorRole: 'admin', action: 'StudentCreated', targetType: 'Student', details: 'Seed data initialization' },
    { actor: mentorUsers[0]._id, actorRole: 'mentor', action: 'InterventionCreated', targetType: 'Intervention', details: 'Seed data initialization' },
  ]);

  console.log('[SEED] Demo data created successfully.');
  console.log('----------------------------------------------------');
  console.log('Demo credentials:');
  console.log('  Admin:      admin@campus.edu / Admin@123');
  console.log('  Mentor:     arvind.mentor@campus.edu / Mentor@123');
  console.log('  Counselor:  divya.counselor@campus.edu / Counselor@123');
  console.log('  Student:    cse2023002@campus.edu / Student@123 (Needs Attention)');
  console.log('  Student:    cse2023003@campus.edu / Student@123 (High Priority)');
  console.log('----------------------------------------------------');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('[SEED] Failed:', err);
  process.exit(1);
});
