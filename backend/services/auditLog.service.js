const AuditLog = require('../models/AuditLog');

// Fire-and-forget audit logging: failures here must never break the
// primary request, so errors are caught and logged instead of thrown.
async function logAudit({ actor, action, targetType, targetId, details }) {
  try {
    await AuditLog.create({
      actor: actor._id || actor,
      actorRole: actor.role,
      action,
      targetType,
      targetId,
      details,
    });
  } catch (err) {
    console.error('[AUDIT] Failed to write audit log:', err.message); // eslint-disable-line no-console
  }
}

module.exports = { logAudit };
