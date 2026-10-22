require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
const StudentProfile = require("../models/StudentProfile");
const JobOpening = require("../models/JobOpening");

const SHARED_PASSWORD = "Password123!";

const coordinatorUser = {
  name: "Demo Coordinator",
  email: "coordinator@campusflow.ai",
  password: SHARED_PASSWORD,
  role: "COORDINATOR"
};

const studentProfiles = [
  { name: "stud1", branch: "Computer Science", graduationYear: 2026, cgpa: 9.1, skills: ["Java", "SQL", "Spring Boot", "AWS"] },
  { name: "stud2", branch: "Computer Science", graduationYear: 2026, cgpa: 8.9, skills: ["JavaScript", "React", "Node.js"] },
  { name: "stud3", branch: "Information Technology", graduationYear: 2025, cgpa: 8.6, skills: ["Python", "SQL", "Power BI", "Excel"] },
  { name: "stud4", branch: "Computer Science", graduationYear: 2027, cgpa: 8.7, skills: ["Java", "Python", "MySQL", "SQL", "Testing", "Automation"] },
  { name: "stud5", branch: "Electronics", graduationYear: 2026, cgpa: 8.4, skills: ["C++", "Embedded Systems", "Python"] },
  { name: "stud6", branch: "Computer Science", graduationYear: 2026, cgpa: 9.3, skills: ["JavaScript", "React", "MongoDB", "Node.js"] },
  { name: "stud7", branch: "Information Technology", graduationYear: 2025, cgpa: 8.3, skills: ["Python", "SQL", "Tableau"] },
  { name: "stud8", branch: "Computer Science", graduationYear: 2026, cgpa: 8.5, skills: ["Java", "C#", "AWS", "Linux", "Python", "Docker"] },
  { name: "stud9", branch: "Computer Science", graduationYear: 2026, cgpa: 8.8, skills: ["Java", "Spring Boot", "Microservices"] },
  { name: "stud10", branch: "Electronics", graduationYear: 2025, cgpa: 8.2, skills: ["Python", "Embedded Systems", "IoT", "C++"] },
  { name: "stud11", branch: "Information Technology", graduationYear: 2026, cgpa: 8.7, skills: ["JavaScript", "Node.js", "Express"] },
  { name: "stud12", branch: "Computer Science", graduationYear: 2026, cgpa: 9.0, skills: ["Python", "Machine Learning", "SQL"] },
  { name: "stud13", branch: "Computer Science", graduationYear: 2025, cgpa: 8.4, skills: ["React", "JavaScript", "TypeScript"] },
  { name: "stud14", branch: "Information Technology", graduationYear: 2026, cgpa: 8.6, skills: ["SQL", "Excel", "Data Analysis"] },
  { name: "stud15", branch: "Electronics", graduationYear: 2027, cgpa: 8.1, skills: ["C++", "VLSI", "Python"] },
  { name: "stud16", branch: "Computer Science", graduationYear: 2025, cgpa: 8.9, skills: ["Java", "Kafka", "Docker"] },
  { name: "stud17", branch: "Information Technology", graduationYear: 2026, cgpa: 8.5, skills: ["React", "JavaScript", "CSS"] },
  { name: "stud18", branch: "Computer Science", graduationYear: 2026, cgpa: 8.8, skills: ["Java", "SQL", "AWS"] },
  { name: "stud19", branch: "Electronics", graduationYear: 2025, cgpa: 8.3, skills: ["Python", "Automation", "Testing", "Cybersecurity", "Linux", "Networking"] },
  { name: "stud20", branch: "Computer Science", graduationYear: 2027, cgpa: 8.7, skills: ["JavaScript", "Node.js", "MongoDB"] }
];

const additionalDemoSkills = {
  "Problem Solving": studentProfiles.map((profile) => profile.name),
  Java: ["stud2", "stud3", "stud5", "stud6", "stud7", "stud10"],
  React: ["stud1", "stud3", "stud4", "stud5", "stud7"],
  Python: ["stud1", "stud2", "stud6", "stud9", "stud11", "stud16"],
  AWS: ["stud2", "stud3", "stud4", "stud5", "stud6", "stud7"],
  Testing: ["stud1", "stud2", "stud3", "stud5", "stud6", "stud7", "stud8", "stud9", "stud11", "stud12"],
  Cybersecurity: ["stud1", "stud2", "stud3", "stud4", "stud5", "stud6", "stud7", "stud8"],
  "Node.js": ["stud1", "stud3", "stud4", "stud5", "stud7", "stud8", "stud9", "stud10", "stud12", "stud13", "stud14"],
  "C++": ["stud1", "stud2", "stud3", "stud4", "stud6", "stud7"]
};

for (const profile of studentProfiles) {
  for (const [skill, students] of Object.entries(additionalDemoSkills)) {
    if (students.includes(profile.name) && !profile.skills.includes(skill)) {
      profile.skills.push(skill);
    }
  }
}

const jobs = [
  {
    companyName: "Nexa Labs",
    title: "Software Engineer",
    description: "Build scalable backend services with Java. Spring Boot, SQL, and cloud deployment experience are preferred.",
    deadline: new Date("2026-12-31T00:00:00.000Z"),
    status: "OPEN",
    extractedRequirements: {
      skills: ["Java", "Problem Solving", "Communication"],
      minCGPA: 8.0,
      branches: ["Computer Science", "Information Technology", "Electronics"],
      graduationYears: [2025, 2026, 2027],
      location: "Bengaluru",
      workMode: "Hybrid",
      additionalNotes: "Strong problem solving skills required."
    }
  },
  {
    companyName: "BrightPath",
    title: "Frontend Developer",
    description: "Create responsive web experiences with React. JavaScript, CSS, and performance optimization experience are preferred.",
    deadline: new Date("2026-11-30T00:00:00.000Z"),
    status: "OPEN",
    extractedRequirements: {
      skills: ["React", "Problem Solving", "Communication"],
      minCGPA: 8.0,
      branches: ["Computer Science", "Information Technology", "Electronics"],
      graduationYears: [2025, 2026, 2027],
      location: "Hyderabad",
      workMode: "On-site",
      additionalNotes: "Portfolio or project experience preferred."
    }
  },
  {
    companyName: "InsightCore",
    title: "Data Analyst",
    description: "Analyze business trends with Python. SQL, Excel, and dashboard tools are preferred.",
    deadline: new Date("2026-12-15T00:00:00.000Z"),
    status: "OPEN",
    extractedRequirements: {
      skills: ["Python", "Problem Solving", "Communication"],
      minCGPA: 8.0,
      branches: ["Computer Science", "Information Technology", "Electronics"],
      graduationYears: [2025, 2026, 2027],
      location: "Remote",
      workMode: "Remote",
      additionalNotes: "Business communication skills are a plus."
    }
  },
  {
    companyName: "CoreCloud",
    title: "Cloud Engineer",
    description: "Manage cloud infrastructure using AWS. Linux, Python, Docker, and DevOps experience are preferred.",
    deadline: new Date("2026-12-20T00:00:00.000Z"),
    status: "OPEN",
    extractedRequirements: {
      skills: ["AWS", "Problem Solving", "Communication"],
      minCGPA: 8.0,
      branches: ["Computer Science", "Information Technology", "Electronics"],
      graduationYears: [2025, 2026, 2027],
      location: "Pune",
      workMode: "Hybrid",
      additionalNotes: "Hands-on deployment experience preferred."
    }
  },
  {
    companyName: "Qube Systems",
    title: "QA Automation Engineer",
    description: "Design and automate application testing. Testing experience is required; Java, Selenium, and CI/CD are preferred.",
    deadline: new Date("2026-11-25T00:00:00.000Z"),
    status: "OPEN",
    extractedRequirements: {
      skills: ["Testing", "Problem Solving", "Communication"],
      minCGPA: 8.0,
      branches: ["Computer Science", "Information Technology", "Electronics"],
      graduationYears: [2025, 2026, 2027],
      location: "Chennai",
      workMode: "On-site",
      additionalNotes: "Attention to quality and bug reporting is essential."
    }
  },
  {
    companyName: "SecureGrid",
    title: "Cybersecurity Analyst",
    description: "Monitor threats and protect enterprise systems. Cybersecurity experience is required; Linux, Python, and networking are preferred.",
    deadline: new Date("2026-12-10T00:00:00.000Z"),
    status: "OPEN",
    extractedRequirements: {
      skills: ["Cybersecurity", "Problem Solving", "Communication"],
      minCGPA: 8.0,
      branches: ["Computer Science", "Information Technology", "Electronics"],
      graduationYears: [2025, 2026, 2027],
      location: "Bengaluru",
      workMode: "Hybrid",
      additionalNotes: "Security fundamentals and risk awareness required."
    }
  },
  {
    companyName: "PixelForge",
    title: "Full Stack Developer",
    description: "Develop full-stack features with Node.js. React, MongoDB, and JavaScript experience are preferred.",
    deadline: new Date("2026-12-18T00:00:00.000Z"),
    status: "OPEN",
    extractedRequirements: {
      skills: ["Node.js", "Problem Solving", "Communication"],
      minCGPA: 8.0,
      branches: ["Computer Science", "Information Technology", "Electronics"],
      graduationYears: [2025, 2026, 2027],
      location: "Remote",
      workMode: "Remote",
      additionalNotes: "Comfort with API integrations is required."
    }
  },
  {
    companyName: "SignalWorks",
    title: "Embedded Systems Engineer",
    description: "Work on hardware-software integration with C++. Embedded Systems, Python, and IoT experience are preferred.",
    deadline: new Date("2026-11-20T00:00:00.000Z"),
    status: "OPEN",
    extractedRequirements: {
      skills: ["C++", "Problem Solving", "Communication"],
      minCGPA: 8.0,
      branches: ["Electronics", "Computer Science", "Information Technology"],
      graduationYears: [2025, 2026, 2027],
      location: "Noida",
      workMode: "On-site",
      additionalNotes: "Hardware debugging experience is preferred."
    }
  }
];

const seedDemoUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const coordinatorPasswordHash = await bcrypt.hash(coordinatorUser.password, 12);
    const coordinatorDoc = await User.findOneAndUpdate(
      { email: coordinatorUser.email.toLowerCase() },
      {
        name: coordinatorUser.name,
        email: coordinatorUser.email.toLowerCase(),
        passwordHash: coordinatorPasswordHash,
        role: coordinatorUser.role
      },
      {
        upsert: true,
        returnDocument: "after",
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    console.log(`Created/updated coordinator: ${coordinatorUser.email}`);

    for (const profile of studentProfiles) {
      const email = `${profile.name}@campusflow.ai`;
      const passwordHash = await bcrypt.hash(SHARED_PASSWORD, 12);

      const user = await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        {
          name: profile.name,
          email: email.toLowerCase(),
          passwordHash,
          role: "STUDENT"
        },
        {
          upsert: true,
          returnDocument: "after",
          runValidators: true,
          setDefaultsOnInsert: true
        }
      );

      await StudentProfile.findOneAndUpdate(
        { userId: user._id },
        {
          userId: user._id,
          fullName: profile.name,
          branch: profile.branch,
          graduationYear: profile.graduationYear,
          cgpa: profile.cgpa,
          skills: profile.skills,
          experience: "Academic projects and internships",
          resumeText: "Demo student profile for placement workflow."
        },
        {
          upsert: true,
          returnDocument: "after",
          runValidators: true,
          setDefaultsOnInsert: true
        }
      );

      console.log(`Created/updated student: ${profile.name} (${email})`);
    }

    await JobOpening.deleteMany({
      createdBy: coordinatorDoc._id,
      $or: [
        ...jobs.map((job) => ({
          companyName: job.companyName,
          title: job.title
        })),
        { companyName: "xyz", title: "ABC" },
        { companyName: "Acme", title: "Data Analyst" }
      ]
    });

    await JobOpening.insertMany(
      jobs.map((job) => ({
        ...job,
        createdBy: coordinatorDoc._id,
        deadline: new Date(job.deadline)
      }))
    );

    console.log(`Created ${jobs.length} good job openings.`);
    console.log("Demo users and job seed complete");
  } catch (error) {
    console.error("Demo seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedDemoUsers();
