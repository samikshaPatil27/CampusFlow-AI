const mongoose = require("mongoose");

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Full name must contain at least 2 characters"],
      maxlength: [100, "Full name cannot exceed 100 characters"]
    },

    branch: {
      type: String,
      required: [true, "Branch is required"],
      trim: true,
      maxlength: [100, "Branch cannot exceed 100 characters"]
    },

    graduationYear: {
      type: Number,
      required: [true, "Graduation year is required"],
      min: [2000, "Graduation year must be 2000 or later"],
      max: [2100, "Graduation year must be 2100 or earlier"]
    },

    cgpa: {
      type: Number,
      required: [true, "CGPA is required"],
      min: [0, "CGPA cannot be negative"],
      max: [10, "CGPA cannot exceed 10"]
    },

    skills: {
      type: [String],
      default: []
    },

    experience: {
      type: String,
      trim: true,
      maxlength: [2000, "Experience cannot exceed 2000 characters"]
    },

    resumeText: {
      type: String,
      trim: true,
      maxlength: [10000, "Resume text cannot exceed 10000 characters"]
    }
  },
  {
    timestamps: true
  }
);

const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema);

module.exports = StudentProfile;