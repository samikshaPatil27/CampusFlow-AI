const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

app.use(express.json({ limit: "1mb" }));

app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

// Security: strip NoSQL injection operators
const sanitizeRequest = require("./middleware/sanitizeMiddleware");
app.use(sanitizeRequest);

// Auth routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// Student routes
const studentRoutes = require("./routes/studentRoutes");
app.use("/api/students", studentRoutes);

// Job routes (includes extraction, approval, matches)
const jobRoutes = require("./routes/jobRoutes");
app.use("/api/jobs", jobRoutes);

// Communication routes
const communicationRoutes = require("./routes/communicationRoutes");
app.use("/api/communications", communicationRoutes);

// Health route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CampusFlow AI API is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
const notFound = require("./middleware/notFound");
app.use(notFound);

// Global error handler (must be last)
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

module.exports = app;