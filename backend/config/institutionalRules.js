/**
 * Institutional Rules & Thresholds Configuration (Single Source of Truth)
 * Centralizes all policy limits, thresholds, and business workflow constraints.
 */

const INSTITUTIONAL_RULES = Object.freeze({
  ATTENDANCE: Object.freeze({
    HEALTHY_MIN: 85,      // >= 85% => Healthy
    ATTENTION_MIN: 75,    // 75 - 84.99% => Attention Required, < 75% => Critical
  }),

  ACADEMIC: Object.freeze({
    LOW_GPA: 5.5,         // Below 5.5 => Low GPA alert / High risk signal
    WARNING_GPA: 6.0,     // Below 6.0 => Academic concern
    ARREAR_WARNING: 1,    // 1 arrear => Warning
    ARREAR_CRITICAL: 2,   // 2+ arrears => Critical signal
  }),

  FOLLOWUP: Object.freeze({
    RECENT_DAYS: 60,      // Bound follow-up evaluation to last 60 days to prevent historical penalty
    REPEATED_THRESHOLD: 2 // 2+ follow-ups within recent window triggers repeated requirement flag
  }),

  INTERVENTIONS: Object.freeze({
    ACTIVE_STATUSES: Object.freeze(['Open', 'In Progress', 'Follow-up']),
    TERMINAL_STATUSES: Object.freeze(['Resolved', 'Closed']),
    ALLOWED_ROLES_FOR_ASSIGNMENT: Object.freeze(['mentor', 'counselor', 'admin']),
  }),

  APPOINTMENTS: Object.freeze({
    CONFLICT_WINDOW_MINUTES: 30,
    VALID_STATUS_TRANSITIONS: Object.freeze({
      Pending: Object.freeze(['Confirmed', 'Rejected', 'Cancelled']),
      Confirmed: Object.freeze(['Completed', 'Cancelled']),
      Completed: Object.freeze([]),
      Rejected: Object.freeze([]),
      Cancelled: Object.freeze([])
    })
  })
});

module.exports = { INSTITUTIONAL_RULES };
