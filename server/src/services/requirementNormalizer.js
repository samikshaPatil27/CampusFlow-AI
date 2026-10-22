const normalizeSkill = (skill) => {
  if (typeof skill !== "string") return "";

  const value = skill
    .toLowerCase()
    .replace(/c\s*#/gi, "csharp")
    .replace(/\s*\.\s*net\b/gi, " dotnet ")
    .replace(/node\.?js/gi, "nodejs")
    .replace(/react\.?js/gi, "reactjs")
    .replace(/[-_/,|&;+]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return value;
};

const normalizeRequirements = (raw) => {
  if (!raw || typeof raw !== "object") {
    return {
      skills: [],
      minCGPA: null,
      branches: [],
      graduationYears: [],
      location: null,
      workMode: null,
      additionalNotes: null,
      ambiguousOrMissing: []
    };
  }

  const skills = Array.isArray(raw.skills)
    ? [...new Set(
        raw.skills
          .flatMap((skill) => normalizeSkill(skill).split(/\s+/).filter(Boolean))
          .filter(Boolean)
      )]
    : [];

  let minCGPA = null;
  if (typeof raw.minCGPA === "number" && raw.minCGPA >= 0 && raw.minCGPA <= 10) {
    minCGPA = raw.minCGPA;
  }

  const branches = Array.isArray(raw.branches)
    ? raw.branches.map(normalizeSkill).filter(Boolean)
    : [];

  const graduationYears = Array.isArray(raw.graduationYears)
    ? raw.graduationYears
        .filter((y) => typeof y === "number" && y >= 2000 && y <= 2100)
    : [];

  const location =
    typeof raw.location === "string" && raw.location.trim()
      ? raw.location.trim()
      : null;

  const validWorkModes = ["On-site", "Remote", "Hybrid"];
  const workMode =
    typeof raw.workMode === "string" &&
    validWorkModes.includes(raw.workMode)
      ? raw.workMode
      : null;

  const additionalNotes =
    typeof raw.additionalNotes === "string" && raw.additionalNotes.trim()
      ? raw.additionalNotes.trim()
      : null;

  const ambiguousOrMissing = Array.isArray(raw.ambiguousOrMissing)
    ? raw.ambiguousOrMissing.map(normalizeSkill).filter(Boolean)
    : [];

  return {
    skills,
    minCGPA,
    branches,
    graduationYears,
    location,
    workMode,
    additionalNotes,
    ambiguousOrMissing
  };
};

module.exports = {
  normalizeRequirements
};