const test = require("node:test");
const assert = require("node:assert/strict");
const JobOpening = require("../src/models/JobOpening");

test("job model stores matching rules separately from extracted requirements", async () => {
  const job = new JobOpening({
    createdBy: "507f1f77bcf86cd799439011",
    companyName: "Example Co",
    title: "Software Engineer",
    description: "A test role",
    deadline: new Date("2027-03-31T23:59:59.000Z"),
    extractedRequirements: { skills: ["SQL"] },
    matchingRules: {
      mustHaveSkills: ["Java"],
      preferredSkills: ["SQL"],
      preferredSkillThreshold: 0.75
    }
  });

  assert.deepEqual(job.matchingRules.mustHaveSkills, ["Java"]);
  assert.deepEqual(job.matchingRules.preferredSkills, ["SQL"]);
  assert.equal(job.matchingRules.preferredSkillThreshold, 0.75);
  assert.deepEqual(job.extractedRequirements.skills, ["SQL"]);
  await job.validate();
});

test("job model can read legacy matching rules nested in extracted requirements", () => {
  const job = new JobOpening({
    createdBy: "507f1f77bcf86cd799439011",
    companyName: "Example Co",
    title: "Software Engineer",
    description: "A legacy role",
    deadline: new Date("2027-03-31T23:59:59.000Z"),
    extractedRequirements: {
      skills: ["SQL"],
      matchingRules: {
        mustHaveSkills: ["Java"],
        preferredSkills: ["SQL"],
        preferredSkillThreshold: 0.6
      }
    }
  });

  assert.deepEqual(job.extractedRequirements.matchingRules.mustHaveSkills, ["Java"]);
  assert.equal(job.extractedRequirements.matchingRules.preferredSkillThreshold, 0.6);
});
