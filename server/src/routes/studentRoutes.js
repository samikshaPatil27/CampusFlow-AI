const express = require("express");
const {
  createStudentProfile,
  getMyStudentProfile,
  updateMyStudentProfile
} = require("../controllers/studentController");
const {
  createStudentProfileValidator,
  updateStudentProfileValidator
} = require("../validators/studentValidators");
const validateRequest = require("../middleware/validationMiddleware");
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();
const { importStudents, exportStudents } = require("../controllers/studentImportController");

router.post(
  "/import",
  authenticate,
  authorize("ADMIN", "COORDINATOR"),
  importStudents
);

router.get(
  "/export",
  authenticate,
  authorize("ADMIN", "COORDINATOR"),
  exportStudents
);

// Create profile (students only)
router.post(
  "/profile",
  authenticate,
  authorize("STUDENT"),
  createStudentProfileValidator,
  validateRequest,
  createStudentProfile
);

// Get my profile
router.get(
  "/profile",
  authenticate,
  authorize("STUDENT"),
  getMyStudentProfile
);

// Update my profile
router.patch(
  "/profile",
  authenticate,
  authorize("STUDENT"),
  updateStudentProfileValidator,
  validateRequest,
  updateMyStudentProfile
);

module.exports = router;