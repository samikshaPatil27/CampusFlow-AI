const StudentProfile = require("../models/StudentProfile");
const User = require("../models/User");
const { logAudit } = require("../services/auditService");

const parseCsv = (input) => {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (quoted && char === '"' && input[i + 1] === '"') {
      field += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && input[i + 1] === "\n") i += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (quoted) throw new Error("CSV contains an unterminated quoted field.");
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
};

const escapeCsv = (value) => {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const importStudents = async (req, res, next) => {
  try {
    if (typeof req.body.csv !== "string" || !req.body.csv.trim()) {
      return res.status(400).json({ success: false, message: "A CSV string is required" });
    }
    if (req.body.csv.length > 1_000_000) {
      return res.status(413).json({ success: false, message: "CSV upload cannot exceed 1 MB" });
    }

    let rows;
    try {
      rows = parseCsv(req.body.csv.replace(/^\uFEFF/, ""));
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    const headers = (rows.shift() || []).map((header) => header.trim().toLowerCase());
    if (rows.length > 1000) {
      return res.status(413).json({ success: false, message: "CSV cannot contain more than 1000 student rows" });
    }
    const required = ["email", "fullname", "branch", "graduationyear", "cgpa", "skills"];
    const missingHeaders = required.filter((header) => !headers.includes(header));
    if (missingHeaders.length) {
      return res.status(400).json({
        success: false,
        message: `CSV is missing required headers: ${missingHeaders.join(", ")}`
      });
    }

    const errors = [];
    let imported = 0;
    for (let index = 0; index < rows.length; index += 1) {
      const rowNumber = index + 2;
      const values = Object.fromEntries(headers.map((header, i) => [header, (rows[index][i] || "").trim()]));
      const email = values.email.toLowerCase();
      const year = Number(values.graduationyear);
      const cgpa = Number(values.cgpa);
      const skills = values.skills.split(/[;|]/).map((skill) => skill.trim()).filter(Boolean);

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push({ row: rowNumber, message: "Valid email is required" });
        continue;
      }
      if (!values.fullname || values.fullname.length < 2 || values.fullname.length > 100 ||
          !values.branch || values.branch.length > 100 ||
          !Number.isInteger(year) || year < 2000 || year > 2100 ||
          !Number.isFinite(cgpa) || cgpa < 0 || cgpa > 10) {
        errors.push({ row: rowNumber, message: "Name, branch, valid graduation year, and CGPA from 0 to 10 are required" });
        continue;
      }

      const user = await User.findOne({ email }).select("_id role");
      if (!user || user.role !== "STUDENT") {
        errors.push({ row: rowNumber, email, message: "Email must belong to an existing student account" });
        continue;
      }

      await StudentProfile.findOneAndUpdate(
        { userId: user._id },
        {
          $set: {
            userId: user._id,
            fullName: values.fullname,
            branch: values.branch,
            graduationYear: year,
            cgpa,
            skills
          }
        },
        { upsert: true, returnDocument: "after", runValidators: true }
      );
      imported += 1;
    }

    await logAudit({
      actorId: req.user.userId,
      action: "IMPORT_STUDENT_CSV",
      entityType: "StudentProfile",
      entityId: req.user.userId,
      metadata: { imported, rejected: errors.length }
    });
    return res.status(200).json({ success: true, data: { imported, errors } });
  } catch (error) {
    next(error);
  }
};

const exportStudents = async (req, res, next) => {
  try {
    const profiles = await StudentProfile.find({})
      .populate("userId", "email")
      .sort({ fullName: 1 })
      .lean();
    const headers = ["email", "fullName", "branch", "graduationYear", "cgpa", "skills"];
    const lines = [
      headers.join(","),
      ...profiles.map((profile) => [
        profile.userId?.email,
        profile.fullName,
        profile.branch,
        profile.graduationYear,
        profile.cgpa,
        (profile.skills || []).join(";")
      ].map(escapeCsv).join(","))
    ];
    res.set("Content-Type", "text/csv; charset=utf-8");
    res.set("Content-Disposition", "attachment; filename=campusflow-students.csv");
    return res.status(200).send(lines.join("\r\n"));
  } catch (error) {
    next(error);
  }
};

module.exports = { importStudents, exportStudents };
