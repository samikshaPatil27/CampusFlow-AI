const JobOpening = require("../models/JobOpening");
const StudentProfile = require("../models/StudentProfile");
const CandidateTracking = require("../models/CandidateTracking");
const {
  generateCommunicationDraft,
  getCommunicationSubject
} = require("../services/communicationService");
const { logAudit } = require("../services/auditService");

const getJobAndStudent = async (jobId, studentId) => {
  const [job, student] = await Promise.all([
    JobOpening.findById(jobId),
    StudentProfile.findById(studentId).populate("userId", "email name")
  ]);
  return { job, student };
};

const updateCandidate = async (req, res, next) => {
  try {
    const { jobId, studentId } = req.params;
    const { job, student } = await getJobAndStudent(jobId, studentId);
    if (!job || !student) {
      return res.status(404).json({ success: false, message: "Job or student profile not found" });
    }

    const allowed = {};
    if (req.body.stage) allowed.stage = req.body.stage;
    if (req.body.feedback) {
      allowed.feedback = req.body.feedback;
      allowed.feedbackReason = req.body.feedbackReason?.trim() || "";
    }

    const tracking = await CandidateTracking.findOneAndUpdate(
      { jobId, studentId },
      { $set: allowed, $setOnInsert: { jobId, studentId } },
      { upsert: true, returnDocument: "after", runValidators: true }
    );
    await logAudit({
      actorId: req.user.userId,
      action: req.body.feedback ? "RECORD_MATCH_FEEDBACK" : "UPDATE_CANDIDATE_STAGE",
      entityType: "CandidateTracking",
      entityId: tracking._id,
      metadata: { jobId, studentId, ...allowed }
    });

    return res.status(200).json({ success: true, data: { tracking } });
  } catch (error) {
    next(error);
  }
};

const createCommunicationDrafts = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { studentIds, type } = req.body;
    const job = await JobOpening.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job opening not found" });
    }

    const students = await StudentProfile.find({ _id: { $in: studentIds } })
      .populate("userId", "email name");
    if (students.length !== studentIds.length) {
      return res.status(400).json({ success: false, message: "One or more student profiles were not found" });
    }

    const drafts = await Promise.all(students.map(async (student) => {
      const draft = await generateCommunicationDraft({
        type,
        context: {
          studentName: student.fullName,
          studentEmail: student.userId?.email,
          jobTitle: job.title,
          companyName: job.companyName,
          deadline: job.deadline
        }
      });
      const subject = getCommunicationSubject({
        type,
        context: {
          jobTitle: job.title,
          companyName: job.companyName
        }
      });
      const tracking = await CandidateTracking.findOneAndUpdate(
        { jobId, studentId: student._id },
        {
          $set: {
            communicationType: type,
            communicationSubject: subject,
            communicationDraft: draft,
            communicationStatus: "DRAFT",
            communicationUpdatedAt: new Date()
          },
          $setOnInsert: { jobId, studentId: student._id }
        },
        { upsert: true, returnDocument: "after", runValidators: true }
      );
      return {
        studentId: student._id,
        email: student.userId?.email,
        tracking
      };
    }));

    for (const draft of drafts) {
      await logAudit({
        actorId: req.user.userId,
        action: "GENERATE_COMMUNICATION_DRAFT",
        entityType: "CandidateTracking",
        entityId: draft.tracking._id,
        metadata: { jobId, studentId: draft.studentId, type }
      });
    }

    return res.status(201).json({ success: true, data: { drafts } });
  } catch (error) {
    next(error);
  }
};

const markCommunicationSent = async (req, res, next) => {
  try {
    const { jobId, studentId } = req.params;
    const tracking = await CandidateTracking.findOneAndUpdate(
      { jobId, studentId, communicationStatus: "DRAFT", communicationDraft: { $exists: true, $ne: "" } },
      { $set: { communicationStatus: "SENT", communicationUpdatedAt: new Date() } },
      { returnDocument: "after", runValidators: true }
    );
    if (!tracking) {
      return res.status(404).json({ success: false, message: "Reviewed communication draft not found" });
    }

    await logAudit({
      actorId: req.user.userId,
      action: "MARK_COMMUNICATION_SENT",
      entityType: "CandidateTracking",
      entityId: tracking._id,
      metadata: { jobId, studentId }
    });
    return res.status(200).json({ success: true, data: { tracking } });
  } catch (error) {
    next(error);
  }
};

const updateCommunicationDraft = async (req, res, next) => {
  try {
    const { jobId, studentId } = req.params;
    const tracking = await CandidateTracking.findOneAndUpdate(
      { jobId, studentId, communicationStatus: "DRAFT" },
      { $set: { communicationDraft: req.body.draft.trim(), communicationUpdatedAt: new Date() } },
      { returnDocument: "after", runValidators: true }
    );
    if (!tracking) {
      return res.status(404).json({ success: false, message: "Communication draft not found or already marked sent" });
    }

    await logAudit({
      actorId: req.user.userId,
      action: "EDIT_COMMUNICATION_DRAFT",
      entityType: "CandidateTracking",
      entityId: tracking._id,
      metadata: { jobId, studentId }
    });
    return res.status(200).json({ success: true, data: { tracking } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateCandidate,
  createCommunicationDrafts,
  markCommunicationSent,
  updateCommunicationDraft
};
