require("dotenv").config();
const fs = require("fs");
const path = require("path");

const branches = ["Computer Science", "Information Technology", "Electronics"];
const skillsPool = ["JavaScript", "Node.js", "React", "Python", "MongoDB", "Java"];

const generateStudents = (count) => {
  const students = [];
  for (let i = 0; i < count; i++) {
    students.push({
      fullName: `Student ${i + 1}`,
      branch: branches[i % branches.length],
      graduationYear: 2026 + (i % 3),
      cgpa: 6 + (i % 5) * 0.8,
      skills: [skillsPool[i % skillsPool.length], skillsPool[(i + 1) % skillsPool.length]],
      experience: "Academic projects",
      resumeText: "Synthetic resume text for evaluation."
    });
  }
  return students;
};

const generateJobs = (count) => {
  const jobs = [];
  for (let i = 0; i < count; i++) {
    jobs.push({
      companyName: `Company ${i + 1}`,
      title: `Role ${i + 1}`,
      description: "Synthetic job description for evaluation.",
      deadline: new Date("2027-12-31"),
      status: "OPEN",
      extractedRequirements: {
        skills: [skillsPool[i % skillsPool.length]],
        minCGPA: 7 + (i % 3),
        branches: [branches[i % branches.length]],
        graduationYears: [2027]
      }
    });
  }
  return jobs;
};

const generateDataset = async () => {
  try {
    const students = generateStudents(50);
    const jobs = generateJobs(10);

    const dataset = { students, jobs };
    const filePath = path.join(__dirname, "../../../docs/evaluation-dataset.json");
    fs.writeFileSync(filePath, JSON.stringify(dataset, null, 2));

    console.log(`Generated ${students.length} students and ${jobs.length} jobs.`);
    console.log(`Dataset saved to ${filePath}`);
  } catch (error) {
    console.error("Dataset generation failed:", error.message);
    process.exit(1);
  }
};

generateDataset();