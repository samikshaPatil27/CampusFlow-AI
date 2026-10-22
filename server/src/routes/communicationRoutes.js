const express = require("express");
const { draftCommunication } = require("../controllers/communicationController");
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const { body } = require("express-validator");
const validateRequest = require("../middleware/validationMiddleware");

const router = express.Router();

router.post(
  "/draft",
  authenticate,
  authorize("ADMIN", "COORDINATOR"),
  body("type")
    .notEmpty()
    .withMessage("Communication type is required")
    .isIn(["interview-invite", "rejection", "shortlist", "general"])
    .withMessage("Invalid communication type"),
  body("context")
    .notEmpty()
    .withMessage("Context is required")
    .isObject()
    .withMessage("Context must be an object"),
  validateRequest,
  draftCommunication
);

module.exports = router;