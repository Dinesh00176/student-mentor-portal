const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { getPagination, buildPaginatedResponse } = require('../utils/pagination');
const AuditLog = require('../models/AuditLog');

// GET /api/audit-logs (admin only)
const listAuditLogs = asyncHandler(async (req, res) => {
  const { action, actorRole } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};
  if (action) filter.action = action;
  if (actorRole) filter.actorRole = actorRole;

  const [items, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('actor', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments(filter),
  ]);

  sendSuccess(res, 200, buildPaginatedResponse(items, total, page, limit), 'Audit logs fetched.');
});

module.exports = { listAuditLogs };
