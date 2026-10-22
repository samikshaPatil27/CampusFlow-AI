const normalizeSkill = (skill) => {
  if (typeof skill !== "string") return [];

  const text = skill
    .toLowerCase()
    .replace(/c\s*#/gi, "csharp")
    .replace(/\s*\.\s*net\b/gi, " dotnet ")
    .replace(/node\.?js/gi, "nodejs")
    .replace(/react\.?js/gi, "reactjs")
    .replace(/[-_/,|&;+]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return [];

  return text
    .split(/\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
};

const normalizeSkills = (skills) => {
  if (!Array.isArray(skills)) return [];

  return [...new Set(
    skills
      .flatMap((skill) => normalizeSkill(skill))
      .filter((skill) => skill.length > 0)
  )];
};

const checkEligibility = (studentProfile, jobRequirements) => {
  const reasons = [];
  const failures = [];
  const missingSkills = [];

  // Branch check
  const requiredBranches = (jobRequirements.branches || [])
    .map((b) => b.trim().toLowerCase())
    .filter(Boolean);

  if (requiredBranches.length > 0) {
    const studentBranch = (studentProfile.branch || "").trim().toLowerCase();
    if (requiredBranches.includes(studentBranch)) {
      reasons.push(`Branch matches: ${studentProfile.branch}`);
    } else {
      failures.push(
        `Branch does not match. Required: ${requiredBranches.join(", ")}, Student: ${studentProfile.branch}`
      );
    }
  }

  // CGPA check
  if (typeof jobRequirements.minCGPA === "number") {
    if (studentProfile.cgpa >= jobRequirements.minCGPA) {
      reasons.push(
        `CGPA satisfies minimum requirement: ${studentProfile.cgpa} >= ${jobRequirements.minCGPA}`
      );
    } else {
      failures.push(
        `CGPA below minimum requirement: ${studentProfile.cgpa} < ${jobRequirements.minCGPA}`
      );
    }
  }

  // Graduation year check
  const requiredYears = jobRequirements.graduationYears || [];
  if (requiredYears.length > 0) {
    if (requiredYears.includes(studentProfile.graduationYear)) {
      reasons.push(
        `Graduation year matches: ${studentProfile.graduationYear}`
      );
    } else {
      failures.push(
        `Graduation year does not match. Required: ${requiredYears.join(", ")}, Student: ${studentProfile.graduationYear}`
      );
    }
  }

  // Skills check
  const rules = jobRequirements.matchingRules || {};
  const hasConfiguredRules =
    normalizeSkills(rules.mustHaveSkills || []).length > 0 ||
    normalizeSkills(rules.preferredSkills || []).length > 0;
  const mustHaveSkills = hasConfiguredRules
    ? normalizeSkills(rules.mustHaveSkills || [])
    : [];
  const preferredSkills = hasConfiguredRules
    ? normalizeSkills(rules.preferredSkills || [])
    : normalizeSkills(jobRequirements.skills || []);
  const requiredSkills = [...new Set([...mustHaveSkills, ...preferredSkills])];
  const studentSkills = new Set(normalizeSkills(studentProfile.skills || []));

  if (requiredSkills.length > 0) {
    const matchedSkills = requiredSkills.filter((skill) =>
      studentSkills.has(skill)
    );
    const notMatched = requiredSkills.filter(
      (skill) => !studentSkills.has(skill)
    );

    if (matchedSkills.length > 0) {
      reasons.push(
        `Matched ${matchedSkills.length} of ${requiredSkills.length} required skills: ${matchedSkills.join(", ")}`
      );
    }

    if (notMatched.length > 0) {
      missingSkills.push(...notMatched);
    }

    const missingMustHaveSkills = mustHaveSkills.filter(
      (skill) => !studentSkills.has(skill)
    );
    if (missingMustHaveSkills.length > 0) {
      failures.push(`Missing must-have skills: ${missingMustHaveSkills.join(", ")}`);
    }

    const matchedPreferredCount = preferredSkills.filter((skill) =>
      studentSkills.has(skill)
    ).length;
    const preferredThreshold = Number.isFinite(rules.preferredSkillThreshold)
      ? rules.preferredSkillThreshold
      : 0.5;

    if (
      preferredSkills.length > 0 &&
      matchedPreferredCount / preferredSkills.length <= preferredThreshold
    ) {
      failures.push(
        `Matched ${matchedPreferredCount} of ${preferredSkills.length} preferred skills; must exceed ${Math.round(preferredThreshold * 100)}%.`
      );
    }
  }

  const eligible =
    failures.length === 0 &&
    reasons.length > 0;

  return {
    eligible,
    reasons,
    failures,
    missingSkills
  };
};

module.exports = {
  checkEligibility,
  normalizeSkills
};