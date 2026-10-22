const { body, param, query } = require("express-validator");

const createJobOpeningValidator = [
  body("companyName")
    .trim()
    .notEmpty()
    .withMessage("Company name is required")
    .isLength({ max: 150 })
    .withMessage("Company name cannot exceed 150 characters"),

  body("title")
    .trim()
    .notEmpty()
    .withMessage("Job title is required")
    .isLength({ max: 150 })
    .withMessage("Job title cannot exceed 150 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Job description is required")
    .isLength({ max: 10000 })
    .withMessage("Job description cannot exceed 10000 characters"),

  body("deadline")
    .notEmpty()
    .withMessage("Deadline is required")
    .isISO8601()
    .withMessage("Deadline must be a valid ISO 8601 date string"),

  body("status")
    .optional()
    .isIn([
      "DRAFT",
      "REQUIREMENTS_PENDING_REVIEW",
      "OPEN",
      "CLOSED",
      "ARCHIVED"
    ])
    .withMessage("Invalid job status"),

  body("extractedRequirements")
    .optional()
    .isObject()
    .withMessage("Extracted requirements must be an object"),

  body("matchingRules")
    .optional()
    .isObject()
    .withMessage("Matching rules must be an object"),

  body("matchingRules.mustHaveSkills")
    .optional()
    .isArray()
    .withMessage("Must-have skills must be an array"),

  body("matchingRules.preferredSkills")
    .optional()
    .isArray()
    .withMessage("Preferred skills must be an array"),

  body("matchingRules.preferredSkillThreshold")
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage("Preferred skill threshold must be between 0 and 1")
];

const updateJobOpeningValidator = [
  body("companyName")
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage("Company name cannot exceed 150 characters"),

  body("title")
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage("Job title cannot exceed 150 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 10000 })
    .withMessage("Job description cannot exceed 10000 characters"),

  body("deadline")
    .optional()
    .isISO8601()
    .withMessage("Deadline must be a valid ISO 8601 date string"),

  body("status")
    .optional()
    .isIn([
      "DRAFT",
      "REQUIREMENTS_PENDING_REVIEW",
      "OPEN",
      "CLOSED",
      "ARCHIVED"
    ])
    .withMessage("Invalid job status"),

  body("extractedRequirements")
    .optional()
    .isObject()
    .withMessage("Extracted requirements must be an object"),

  body("matchingRules")
    .optional()
    .isObject()
    .withMessage("Matching rules must be an object"),

  body("matchingRules.mustHaveSkills")
    .optional()
    .isArray()
    .withMessage("Must-have skills must be an array"),

  body("matchingRules.preferredSkills")
    .optional()
    .isArray()
    .withMessage("Preferred skills must be an array"),

  body("matchingRules.preferredSkillThreshold")
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage("Preferred skill threshold must be between 0 and 1")
];

const jobIdParamValidator = [
  param("jobId")
    .notEmpty()
    .withMessage("Job ID is required")
    .isMongoId()
    .withMessage("Job ID must be a valid MongoDB ID")
];

const listJobsQueryValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("status")
    .optional()
    .isIn([
      "DRAFT",
      "REQUIREMENTS_PENDING_REVIEW",
      "OPEN",
      "CLOSED",
      "ARCHIVED"
    ])
    .withMessage("Invalid status filter")
];

const approveRequirementsValidator = [
  body("requirements")
    .notEmpty()
    .withMessage("Requirements are required")
    .isObject()
    .withMessage("Requirements must be an object")
];

module.exports = {
  createJobOpeningValidator,
  updateJobOpeningValidator,
  jobIdParamValidator,
  listJobsQueryValidator,
  approveRequirementsValidator
};