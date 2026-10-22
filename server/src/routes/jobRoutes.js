const express = require("express");
const {
  createJobOpening,
  listJobOpenings,
  getJobOpening,
  updateJobOpening,
  deleteJobOpening,
  extractJobRequirements,
  approveJobRequirements
} = require("../controllers/jobController");

const { getJobMatches } = require("../controllers/matchController");
const {
  updateCandidate,
  createCommunicationDrafts,
  markCommunicationSent,
  updateCommunicationDraft
} = require("../controllers/candidateController");
const { getJobAuditHistory } = require("../controllers/auditController");
const { body, param } = require("express-validator");
const {
  createJobOpeningValidator,
  updateJobOpeningValidator,
  jobIdParamValidator,
  listJobsQueryValidator
} = require("../validators/jobValidators");
const validateRequest = require("../middleware/validationMiddleware");
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// Create job
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "COORDINATOR"),
  createJobOpeningValidator,
  validateRequest,
  createJobOpening
);

// List jobs
router.get(
  "/",
  authenticate,
  listJobsQueryValidator,
  validateRequest,
  listJobOpenings
);

// Get matches for a job
router.get(
  "/:jobId/matches",
  authenticate,
  authorize("ADMIN", "COORDINATOR"),
  jobIdParamValidator,
  validateRequest,
  getJobMatches
);

router.get(
  "/:jobId/audit",
  authenticate,
  authorize("ADMIN", "COORDINATOR"),
  jobIdParamValidator,
  validateRequest,
  getJobAuditHistory
);

router.patch(
  "/:jobId/candidates/:studentId",
  authenticate,
  authorize("ADMIN", "COORDINATOR"),
  jobIdParamValidator,
  param("studentId").isMongoId().withMessage("Student ID must be a valid MongoDB ID"),
  body("stage").optional().isIn(["SHORTLISTED", "CONTACTED", "INTERVIEW", "OFFER", "REJECTED"]),
  body("feedback").optional().isIn(["USEFUL", "INCORRECT"]),
  body("feedbackReason").optional().isString().isLength({ max: 1000 }),
  validateRequest,
  updateCandidate
);

router.post(
  "/:jobId/candidates/communications",
  authenticate,
  authorize("ADMIN", "COORDINATOR"),
  jobIdParamValidator,
  body("studentIds").isArray({ min: 1, max: 50 }),
  body("studentIds.*").isMongoId(),
  body("type").isIn(["interview-invite", "rejection", "shortlist", "general"]),
  validateRequest,
  createCommunicationDrafts
);

router.post(
  "/:jobId/candidates/:studentId/communication-sent",
  authenticate,
  authorize("ADMIN", "COORDINATOR"),
  jobIdParamValidator,
  param("studentId").isMongoId().withMessage("Student ID must be a valid MongoDB ID"),
  validateRequest,
  markCommunicationSent
);

router.patch(
  "/:jobId/candidates/:studentId/communication",
  authenticate,
  authorize("ADMIN", "COORDINATOR"),
  jobIdParamValidator,
  param("studentId").isMongoId().withMessage("Student ID must be a valid MongoDB ID"),
  body("draft").isString().trim().notEmpty().isLength({ max: 10000 }),
  validateRequest,
  updateCommunicationDraft
);

router.post(
  "/:jobId/extract-requirements",
  authenticate,
  authorize("ADMIN", "COORDINATOR"),
  jobIdParamValidator,
  validateRequest,
  extractJobRequirements
);

const {
  approveRequirementsValidator
} = require("../validators/jobValidators");

router.post(
  "/:jobId/approve-requirements",
  authenticate,
  authorize("ADMIN", "COORDINATOR"),
  jobIdParamValidator,
  approveRequirementsValidator,
  validateRequest,
  approveJobRequirements
);

// Get single job
router.get(
  "/:jobId",
  authenticate,
  jobIdParamValidator,
  validateRequest,
  getJobOpening
);

// Update job
router.patch(
  "/:jobId",
  authenticate,
  authorize("ADMIN", "COORDINATOR"),
  jobIdParamValidator,
  updateJobOpeningValidator,
  validateRequest,
  updateJobOpening
);

// Delete job
router.delete(
  "/:jobId",
  authenticate,
  authorize("ADMIN", "COORDINATOR"),
  jobIdParamValidator,
  validateRequest,
  deleteJobOpening
);

module.exports = router;