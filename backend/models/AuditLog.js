const mongoose = require('mongoose');

// Lightweight audit trail for important administrative actions.
// Never stores passwords or auth secrets - only who did what, to what, when.
const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true, trim: true },
    targetType: { type: String, trim: true },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    details: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
