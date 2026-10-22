const StudentProfile = require("../models/StudentProfile");

const createStudentProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const existingProfile = await StudentProfile.findOne({ userId });

    if (existingProfile) {
      return res.status(409).json({
        success: false,
        message: "Student profile already exists for this user"
      });
    }

    const profile = await StudentProfile.create({
      userId,
      ...req.body
    });

    return res.status(201).json({
      success: true,
      message: "Student profile created successfully",
      data: {
        profile
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMyStudentProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const profile = await StudentProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Student profile fetched successfully",
      data: {
        profile
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateMyStudentProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const profile = await StudentProfile.findOneAndUpdate(
      { userId },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Student profile updated successfully",
      data: {
        profile
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStudentProfile,
  getMyStudentProfile,
  updateMyStudentProfile
};