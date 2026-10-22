const mongoose = require("mongoose");

const jobOpeningSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: [150, "Company name cannot exceed 150 characters"]
    },

    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: [150, "Job title cannot exceed 150 characters"]
    },

    description: {
      type: String,
      required: [true, "Job description is required"],
      trim: true,
      maxlength: [10000, "Job description cannot exceed 10000 characters"]
    },

    deadline: {
      type: Date,
      required: [true, "Deadline is required"]
    },

    status: {
      type: String,
      enum: {
        values: [
          "DRAFT",
          "REQUIREMENTS_PENDING_REVIEW",
          "OPEN",
          "CLOSED",
          "ARCHIVED"
        ],
        message: "Invalid job status"
      },
      default: "DRAFT"
    },

    extractedRequirements: {
      skills: {
        type: [String],
        default: []
      },

      minCGPA: {
        type: Number,
        min: [0, "Minimum CGPA cannot be negative"],
        max: [10, "Minimum CGPA cannot exceed 10"]
      },

      branches: {
        type: [String],
        default: []
      },

      graduationYears: {
        type: [Number],
        default: []
      },

      location: {
        type: String,
        trim: true
      },

      workMode: {
        type: String,
        enum: {
          values: ["On-site", "Remote", "Hybrid"],
          message: "Work mode must be On-site, Remote, or Hybrid"
        }
      },

      matchingRules: {
        mustHaveSkills: {
          type: [String],
          default: []
        },
        preferredSkills: {
          type: [String],
          default: []
        },
        preferredSkillThreshold: {
          type: Number,
          min: 0,
          max: 1,
          default: 0.5
        }
      },

      additionalNotes: {
        type: String,
        trim: true
      }
    },

    matchingRules: {
      mustHaveSkills: {
        type: [String],
        default: []
      },
      preferredSkills: {
        type: [String],
        default: []
      },
      preferredSkillThreshold: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.5
      }
    }
  },
  {
    timestamps: true
  }
);

const JobOpening = mongoose.model("JobOpening", jobOpeningSchema);

module.exports = JobOpening;