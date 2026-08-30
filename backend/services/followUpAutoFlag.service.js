const FollowUp = require('../models/FollowUp');
const Student = require('../models/Student');
const { notify } = require('./notify.service');

// Flips any Pending follow-up whose due date has passed to Overdue, and
// sends a one-time notification to the assigned mentor for each newly
// overdue item (guarded so it never re-notifies on subsequent calls).
async function autoFlagOverdueFollowUps(filter = {}) {
  const nowOverdue = await FollowUp.find({ ...filter, status: 'Pending', dueDate: { $lt: new Date() } });
  if (nowOverdue.length === 0) return;

  const ids = nowOverdue.map((f) => f._id);
  await FollowUp.updateMany({ _id: { $in: ids } }, { status: 'Overdue' });

  for (const followUp of nowOverdue) { // eslint-disable-line no-restricted-syntax
    const student = await Student.findById(followUp.student).select('assignedMentor studentCode'); // eslint-disable-line no-await-in-loop
    if (student?.assignedMentor) {
      await notify({ // eslint-disable-line no-await-in-loop
        user: student.assignedMentor, type: 'FollowUpDue', relatedStudent: followUp.student,
        message: `Follow-up for ${student.studentCode} is now overdue.`,
      });
    }
  }
}

module.exports = { autoFlagOverdueFollowUps };
