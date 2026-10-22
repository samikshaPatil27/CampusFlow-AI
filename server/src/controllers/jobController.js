const JobOpening = require("../models/JobOpening");
const { logAudit } = require("../services/auditService");
const {
  extractRequirementsFromDescription
} = require("../services/ollamaService");
const {
  normalizeRequirements
} = require("../services/requirementNormalizer");

const closeExpiredJobs = async () => {
  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);

  await JobOpening.updateMany(
    { status: "OPEN", deadline: { $lt: todayUtc } },
    { $set: { status: "CLOSED" } }
  );
};


const createJobOpening = async (req, res, next) => {
  try {
    const createdBy = req.user.userId;

    const job = await JobOpening.create({
      createdBy,
      ...req.body
    });
    await logAudit({
      actorId: req.user.userId,
      action: "CREATE_JOB",
      entityType: "JobOpening",
      entityId: job._id,
      metadata: { title: job.title, companyName: job.companyName }
    });

    return res.status(201).json({
      success: true,
      message: "Job opening created successfully",
      data: {
        job
      }
    });
  } catch (error) {
    next(error);
  }
};


const listJobOpenings = async (req, res, next) => {
  try {
    await closeExpiredJobs();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    const skip = (page - 1) * limit;

    const filter = status ? { status } : {};

    const [jobs, total] = await Promise.all([
      JobOpening.find(filter)
        .populate("createdBy", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      JobOpening.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      message: "Job openings fetched successfully",
      data: {
        jobs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};


const getJobOpening = async (req, res, next) => {
  try {
    await closeExpiredJobs();

    const { jobId } = req.params;

    const job = await JobOpening.findById(jobId).populate(
      "createdBy",
      "name email role"
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job opening not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job opening fetched successfully",
      data: {
        job
      }
    });
  } catch (error) {
    next(error);
  }
};


const updateJobOpening = async (req, res, next) => {
  try {
    await closeExpiredJobs();

    const { jobId } = req.params;

    const job = await JobOpening.findByIdAndUpdate(
      jobId,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate("createdBy", "name email role");

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job opening not found"
      });
    }

    await logAudit({
      actorId: req.user.userId,
      action: "UPDATE_JOB",
      entityType: "JobOpening",
      entityId: job._id,
      metadata: { updatedFields: Object.keys(req.body) }
    });

    await closeExpiredJobs();
    const todayUtc = new Date();
    todayUtc.setUTCHours(0, 0, 0, 0);
    if (job.status === "OPEN" && job.deadline < todayUtc) {
      job.status = "CLOSED";
    }

    return res.status(200).json({
      success: true,
      message: "Job opening updated successfully",
      data: {
        job
      }
    });
  } catch (error) {
    next(error);
  }
};


const deleteJobOpening = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const job = await JobOpening.findByIdAndDelete(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job opening not found"
      });
    }

    await logAudit({
      actorId: req.user.userId,
      action: "DELETE_JOB",
      entityType: "JobOpening",
      entityId: job._id,
      metadata: { title: job.title, companyName: job.companyName }
    });

    return res.status(200).json({
      success: true,
      message: "Job opening deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};


const extractJobRequirements = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const job = await JobOpening.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job opening not found"
      });
    }

    const rawRequirements = await extractRequirementsFromDescription(
      job.description
    );

    const normalized = normalizeRequirements(rawRequirements);

    // Do NOT save yet — return for human review
    return res.status(200).json({
      success: true,
      message: "Requirements extracted. Review before approving.",
      data: {
        jobId,
        rawRequirements,
        normalizedRequirements: normalized
      }
    });
  } catch (error) {
    next(error);
  }
};


const approveJobRequirements = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { requirements } = req.body;

    const job = await JobOpening.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job opening not found"
      });
    }

    const normalized = normalizeRequirements(requirements);

    job.extractedRequirements = normalized;
    job.status = "OPEN";
    await job.save();

    // Audit log
    await logAudit({
      actorId: req.user.userId,
      action: "APPROVE_JOB_REQUIREMENTS",
      entityType: "JobOpening",
      entityId: job._id,
      metadata: {
        requirements: normalized
      }
    });

    return res.status(200).json({
      success: true,
      message: "Requirements approved and job opened",
      data: {
        job
      }
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  createJobOpening,
  listJobOpenings,
  getJobOpening,
  updateJobOpening,
  deleteJobOpening,
  extractJobRequirements,
  approveJobRequirements
};