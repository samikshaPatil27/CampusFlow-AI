const errorHandler = (err, req, res, next) => {
  console.error("Unhandled error:", err.message);

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Duplicate key error",
      errors: [
        {
          field: Object.keys(err.keyValue || {})[0] || "unknown",
          message: "This value already exists"
        }
      ]
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: Object.values(err.errors).map((e) => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Mongoose invalid ObjectId
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format"
    });
  }

  // Default
  return res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error"
  });
};

module.exports = errorHandler;