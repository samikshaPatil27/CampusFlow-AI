const mongoose = require("mongoose");

const candidateTrackingSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobOpening",
      required: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true
    },
    stage: {
      type: String,
      enum: ["SHORTLISTED", "CONTACTED", "INTERVIEW", "OFFER", "REJECTED"]
    },
    feedback: {
      type: String,
      enum: ["USEFUL", "INCORRECT"]
    },
    feedbackReason: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    communicationType: {
      type: String,
      enum: ["interview-invite", "rejection", "shortlist", "general"]
    },
    communicationSubject: {
      type: String,
      trim: true,
      maxlength: 300
    },
    communicationDraft: {
      type: String,
      maxlength: 10000
    },
    communicationStatus: {
      type: String,
      enum: ["DRAFT", "SENT"]
    },
    communicationUpdatedAt: Date
  },
  { timestamps: true }
);

candidateTrackingSchema.index({ jobId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("CandidateTracking", candidateTrackingSchema);
