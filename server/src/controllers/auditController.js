const AuditLog = require("../models/AuditLog");
const JobOpening = require("../models/JobOpening");

const getJobAuditHistory = async (req, res, next) => {
  try {
    const job = await JobOpening.findById(req.params.jobId).select("_id");
    if (!job) {
      return res.status(404).json({ success: false, message: "Job opening not found" });
    }

    const logs = await AuditLog.find({
      $or: [
        { entityType: "JobOpening", entityId: job._id },
        { entityType: "CandidateTracking", "metadata.jobId": job._id.toString() }
      ]
    })
      .populate("actorId", "name email")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({ success: true, data: { logs } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getJobAuditHistory };
