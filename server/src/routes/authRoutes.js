const express = require("express");
const { register, login } = require("../controllers/authController");
const {
  registerValidator,
  loginValidator
} = require("../validators/authValidators");
const validateRequest = require("../middleware/validationMiddleware");
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/register", registerValidator, validateRequest, register);
router.post("/login", loginValidator, validateRequest, login);

// Protected test route
router.get("/protected-test", authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    message: "You can access this protected route",
    data: {
      userId: req.user.userId,
      role: req.user.role
    }
  });
});

// Coordinator-level test route
router.get(
  "/coordinator-test",
  authenticate,
  authorize("ADMIN", "COORDINATOR"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Coordinator-level route accessed"
    });
  }
);

module.exports = router;