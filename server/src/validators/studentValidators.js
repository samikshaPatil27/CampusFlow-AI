const { body } = require("express-validator");

const createStudentProfileValidator = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),

  body("branch")
    .trim()
    .notEmpty()
    .withMessage("Branch is required")
    .isLength({ max: 100 })
    .withMessage("Branch cannot exceed 100 characters"),

  body("graduationYear")
    .isInt({ min: 2000, max: 2100 })
    .withMessage("Graduation year must be between 2000 and 2100"),

  body("cgpa")
    .isFloat({ min: 0, max: 10 })
    .withMessage("CGPA must be between 0 and 10"),

  body("skills")
    .optional()
    .isArray()
    .withMessage("Skills must be an array of strings"),

  body("skills.*")
    .optional()
    .isString()
    .withMessage("Each skill must be a string"),

  body("experience")
    .optional()
    .isString()
    .withMessage("Experience must be a string"),

  body("resumeText")
    .optional()
    .isString()
    .withMessage("Resume text must be a string")
];

const updateStudentProfileValidator = [
  body("fullName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),

  body("branch")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Branch cannot exceed 100 characters"),

  body("graduationYear")
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage("Graduation year must be between 2000 and 2100"),

  body("cgpa")
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage("CGPA must be between 0 and 10"),

  body("skills")
    .optional()
    .isArray()
    .withMessage("Skills must be an array of strings"),

  body("skills.*")
    .optional()
    .isString()
    .withMessage("Each skill must be a string"),

  body("experience")
    .optional()
    .isString()
    .withMessage("Experience must be a string"),

  body("resumeText")
    .optional()
    .isString()
    .withMessage("Resume text must be a string")
];

module.exports = {
  createStudentProfileValidator,
  updateStudentProfileValidator
};