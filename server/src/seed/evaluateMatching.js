require("dotenv").config();
const { checkEligibility, normalizeSkills } = require("../services/eligibilityService");
const fs = require("fs");
const path = require("path");

const evaluate = async () => {
  try {
    const datasetPath = path.join(__dirname, "../../../docs/evaluation-dataset.json");
    const { students, jobs } = JSON.parse(fs.readFileSync(datasetPath, "utf8"));

    let totalChecks = 0;
    let correctChecks = 0;
    let missingDataDetections = 0;
    const latencies = [];
    let eligibleMatches = 0;
    let ineligibleMatches = 0;

    for (const job of jobs) {
      for (const student of students) {
        const start = Date.now();
        const result = checkEligibility(student, job.extractedRequirements);
        const latency = Date.now() - start;
        latencies.push(latency);
        totalChecks++;

        const requirements = job.extractedRequirements;
        const requiredSkills = normalizeSkills(requirements.skills || []);
        const studentSkills = new Set(normalizeSkills(student.skills || []));
        const matchedSkillCount = requiredSkills.filter((skill) =>
          studentSkills.has(skill)
        ).length;
        const skillsMatch =
          requiredSkills.length === 0 ||
          matchedSkillCount / requiredSkills.length > 0.5;
        const expected =
          requirements.branches.includes(student.branch) &&
          student.cgpa >= (requirements.minCGPA || 0) &&
          requirements.graduationYears.includes(student.graduationYear) &&
          skillsMatch;

        if (result.eligible === expected) correctChecks++;
        if (!student.skills || student.skills.length === 0) missingDataDetections++;
        if (result.eligible) eligibleMatches++;
        else ineligibleMatches++;
      }
    }

    if (totalChecks === 0) {
      throw new Error("Evaluation dataset must contain at least one student and one job.");
    }

    const accuracy = (correctChecks / totalChecks) * 100;
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;

    const results = {
      totalChecks,
      correctChecks,
      eligibilityRuleAgreement: accuracy.toFixed(2) + "%",
      eligibleMatches,
      ineligibleMatches,
      missingDataDetections,
      averageLatencyMs: avgLatency.toFixed(2),
      generatedAt: new Date().toISOString()
    };

    const filePath = path.join(__dirname, "../../../docs/evaluation-results.json");
    fs.writeFileSync(filePath, JSON.stringify(results, null, 2));

    console.log("Evaluation complete:", results);
  } catch (error) {
    console.error("Evaluation failed:", error.message);
    process.exit(1);
  }
};

evaluate();