const AuditLog = require("../models/AuditLog");

const logAudit = async ({ actorId, action, entityType, entityId, metadata }) => {
  try {
    await AuditLog.create({
      actorId,
      action,
      entityType,
      entityId,
      metadata: metadata || {}
    });
  } catch (error) {
    // Never block the main flow because of audit logging failure
    console.error("Audit log failed:", error.message);
  }
};

module.exports = {
  logAudit
};