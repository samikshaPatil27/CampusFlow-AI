const StudentProfile = require("../models/StudentProfile");
const JobOpening = require("../models/JobOpening");
const CandidateTracking = require("../models/CandidateTracking");
const { checkEligibility } = require("../services/eligibilityService");

const getJobMatches = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const job = await JobOpening.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job opening not found"
      });
    }

    const requirements = {
      ...(job.extractedRequirements?.toObject?.() || job.extractedRequirements || {}),
      matchingRules:
        job.matchingRules?.toObject?.() ||
        job.matchingRules ||
        job.extractedRequirements?.matchingRules
    };

    const [students, trackingRows] = await Promise.all([
      StudentProfile.find({}).populate("userId", "email").sort({ fullName: 1 }),
      CandidateTracking.find({ jobId }).lean()
    ]);
    const trackingByStudentId = new Map(
      trackingRows.map((row) => [row.studentId.toString(), row])
    );

    const matches = students.map((student) => {
      const result = checkEligibility(student, requirements);

      return {
        studentId: student._id,
        fullName: student.fullName,
        email: student.userId?.email || "",
        branch: student.branch,
        graduationYear: student.graduationYear,
        cgpa: student.cgpa,
        skills: student.skills,
        eligible: result.eligible,
        reasons: result.reasons,
        failures: result.failures,
        missingSkills: result.missingSkills,
        tracking: trackingByStudentId.get(student._id.toString()) || null
      };
    });

    const eligibleMatches = matches.filter((m) => m.eligible);
    const ineligibleMatches = matches.filter((m) => !m.eligible);

    return res.status(200).json({
      success: true,
      message: "Student matches fetched successfully",
      data: {
        jobId,
        totalStudents: students.length,
        eligibleCount: eligibleMatches.length,
        ineligibleCount: ineligibleMatches.length,
        matches
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getJobMatches
};