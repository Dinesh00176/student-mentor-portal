/**
 * Transparent, rule-based student attention/risk indicator.
 * This is explicitly NOT a predictive or diagnostic AI system - every reason
 * returned here is derived from a plain, explainable, measurable rule.
 */
const { summarizeAttendance, THRESHOLDS: ATT_THRESHOLDS } = require('./attendanceCalculator');
const { computeSemesterGPA } = require('./gpaCalculator');

const RULES = {
  LOW_GPA: 5.5, // gradePoint scale 0-10
  CRITICAL_ATTENDANCE: ATT_THRESHOLDS.ATTENTION_MIN, // below this = flagged
  MAX_OPEN_INTERVENTIONS_FOR_STABLE: 0,
  REPEATED_FOLLOWUPS: 2, // 2+ overdue/completed follow-ups in recent history
};

/**
 * @param {Object} input
 * @param {Array} input.attendanceRecords - latest semester AttendanceRecord docs
 * @param {Array} input.academicRecords - latest semester AcademicRecord docs
 * @param {Array} input.interventions - Intervention docs for the student
 * @param {Array} input.followUps - FollowUp docs for the student
 * @returns {{ status: 'Stable'|'Needs Attention'|'High Priority', reasons: string[], signals: Object }}
 */
function evaluateStudentAttention({ attendanceRecords = [], academicRecords = [], interventions = [], followUps = [] }) {
  const reasons = [];
  let score = 0; // simple additive rule score, thresholds below map score -> status

  const attendanceSummary = summarizeAttendance(attendanceRecords);
  if (attendanceSummary.status === 'Critical') {
    reasons.push(`Attendance is critical at ${attendanceSummary.percentage}% (below ${RULES.CRITICAL_ATTENDANCE}%).`);
    score += 2;
  } else if (attendanceSummary.status === 'Attention Required') {
    reasons.push(`Attendance needs attention at ${attendanceSummary.percentage}%.`);
    score += 1;
  }

  const gpa = computeSemesterGPA(academicRecords);
  const arrearCount = academicRecords.filter((r) => r.isArrear).length;
  if (gpa !== null && gpa < RULES.LOW_GPA) {
    reasons.push(`Academic performance is below threshold (GPA ${gpa} < ${RULES.LOW_GPA}).`);
    score += 2;
  }
  if (arrearCount > 0) {
    reasons.push(`${arrearCount} arrear/failed subject(s) in the current semester.`);
    score += arrearCount >= 2 ? 2 : 1;
  }

  const openInterventions = interventions.filter((i) => ['Open', 'In Progress', 'Follow-up'].includes(i.status));
  if (openInterventions.length > 0) {
    reasons.push(`${openInterventions.length} active intervention(s) in progress.`);
    score += 1;
  }

  const recentFollowUps = followUps.filter((f) => f.status === 'Overdue' || f.status === 'Completed');
  if (recentFollowUps.length >= RULES.REPEATED_FOLLOWUPS) {
    reasons.push(`Repeated follow-up requirement (${recentFollowUps.length} recent follow-ups).`);
    score += 1;
  }
  const overdueFollowUps = followUps.filter((f) => f.status === 'Overdue');
  if (overdueFollowUps.length > 0) {
    reasons.push(`${overdueFollowUps.length} overdue follow-up(s).`);
    score += 1;
  }

  let status = 'Stable';
  if (score >= 4) status = 'High Priority';
  else if (score >= 1) status = 'Needs Attention';

  if (status === 'Stable' && reasons.length === 0) {
    reasons.push('No attendance, academic, or intervention concerns detected.');
  }

  return {
    status,
    reasons,
    signals: {
      attendancePercentage: attendanceSummary.percentage,
      attendanceStatus: attendanceSummary.status,
      gpa,
      arrearCount,
      openInterventionCount: openInterventions.length,
      overdueFollowUpCount: overdueFollowUps.length,
      score,
    },
  };
}

module.exports = { evaluateStudentAttention, RULES };
