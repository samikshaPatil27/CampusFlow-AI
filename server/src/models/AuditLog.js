const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    action: {
      type: String,
      required: true,
      trim: true
    },

    entityType: {
      type: String,
      required: true,
      trim: true
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

module.exports = AuditLog;