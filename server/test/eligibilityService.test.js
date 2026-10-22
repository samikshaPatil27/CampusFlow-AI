const test = require("node:test");
const assert = require("node:assert/strict");
const { checkEligibility, normalizeSkills } = require("../src/services/eligibilityService");

const eligibleStudent = {
  branch: "Computer Science",
  cgpa: 8.5,
  graduationYear: 2026,
  skills: ["Java SQL"]
};

test("matches skills without depending on case, punctuation, or order", () => {
  assert.deepEqual(normalizeSkills(["Java SQL", "node.js", "ReactJS"]), [
    "java",
    "sql",
    "nodejs",
    "reactjs"
  ]);

  const result = checkEligibility(eligibleStudent, {
    branches: ["Computer Science"],
    minCGPA: 8,
    graduationYears: [2026],
    skills: ["SQL, JAVA"]
  });

  assert.equal(result.eligible, true);
  assert.deepEqual(result.missingSkills, []);
});

test("eligibility requires strictly more than half of required skills", () => {
  const threeOfFour = checkEligibility(
    { ...eligibleStudent, skills: ["Java", "SQL", "Python"] },
    { skills: ["Java", "SQL", "Python", "AWS"] }
  );
  const twoOfFour = checkEligibility(
    { ...eligibleStudent, skills: ["Java", "SQL"] },
    { skills: ["Java", "SQL", "Python", "AWS"] }
  );

  assert.equal(threeOfFour.eligible, true);
  assert.equal(twoOfFour.eligible, false);
  assert.deepEqual(twoOfFour.missingSkills, ["python", "aws"]);
});

test("branch, CGPA, and graduation year remain mandatory", () => {
  const result = checkEligibility(
    { ...eligibleStudent, cgpa: 6.5, graduationYear: 2025 },
    {
      branches: ["Information Technology"],
      minCGPA: 7,
      graduationYears: [2026],
      skills: ["Java"]
    }
  );

  assert.equal(result.eligible, false);
  assert.equal(result.failures.length, 3);
});

test("configured must-have skills are mandatory and preferred skills use their configured threshold", () => {
  const passes = checkEligibility(
    { ...eligibleStudent, skills: ["Java", "Python", "AWS"] },
    {
      matchingRules: {
        mustHaveSkills: ["Java"],
        preferredSkills: ["Python", "AWS"],
        preferredSkillThreshold: 0.5
      }
    }
  );
  const missesMustHave = checkEligibility(
    { ...eligibleStudent, skills: ["Python", "AWS"] },
    {
      matchingRules: {
        mustHaveSkills: ["Java"],
        preferredSkills: ["Python", "AWS"],
        preferredSkillThreshold: 0.5
      }
    }
  );
  const meetsExactlyHalf = checkEligibility(
    { ...eligibleStudent, skills: ["Java", "Python"] },
    {
      matchingRules: {
        mustHaveSkills: ["Java"],
        preferredSkills: ["Python", "AWS"],
        preferredSkillThreshold: 0.5
      }
    }
  );

  assert.equal(passes.eligible, true);
  assert.equal(missesMustHave.eligible, false);
  assert.ok(missesMustHave.failures.some((failure) => failure.includes("must-have")));
  assert.equal(meetsExactlyHalf.eligible, false);
});
