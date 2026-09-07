// Attendance % = (Attended Classes / Total Classes) x 100
// Thresholds are explicit, documented constants - not hidden magic numbers.
const THRESHOLDS = {
  HEALTHY_MIN: 85, // >= 85% => Healthy
  ATTENTION_MIN: 75, // 75-84.99% => Attention Required, below => Critical
};

function computePercentage(attended, total) {
  if (!total || total <= 0) return 0;
  return Math.round((attended / total) * 10000) / 100;
}

function classifyAttendance(percentage) {
  if (percentage >= THRESHOLDS.HEALTHY_MIN) return 'Healthy';
  if (percentage >= THRESHOLDS.ATTENTION_MIN) return 'Attention Required';
  return 'Critical';
}

// Aggregate a list of AttendanceRecord docs (optionally already filtered by semester)
function summarizeAttendance(records) {
  const totals = records.reduce(
    (acc, r) => {
      acc.totalClasses += r.totalClasses || 0;
      acc.attendedClasses += r.attendedClasses || 0;
      return acc;
    },
    { totalClasses: 0, attendedClasses: 0 }
  );
  const percentage = computePercentage(totals.attendedClasses, totals.totalClasses);
  return {
    ...totals,
    percentage,
    status: classifyAttendance(percentage),
  };
}

module.exports = { computePercentage, classifyAttendance, summarizeAttendance, THRESHOLDS };
