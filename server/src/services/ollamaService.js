const axios = require("axios");

const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

const FALLBACK_SKILLS = {
  python: ["python", "py"],
  javascript: ["javascript", "js", "nodejs", "node.js"],
  react: ["react", "reactjs"],
  sql: ["sql", "mysql", "postgres", "postgresql"],
  java: ["java"],
  csharp: ["c#", "csharp", ".net"],
  dataanalysis: ["data analysis", "analytics", "power bi", "tableau"],
  machinelearning: ["machine learning", "ml", "ai"],
  cloud: ["aws", "azure", "gcp", "cloud"],
  communication: ["communication", "presentation", "teamwork"],
  problemSolving: ["problem solving", "debugging"],
  testing: ["testing", "qa", "automation"],
  cybersecurity: ["cybersecurity", "security"],
  excel: ["excel", "spreadsheet"]
};

const FALLBACK_BRANCHES = [
  ["computer science", "CS", "CSE", "computer science and engineering"],
  ["information technology", "IT"],
  ["electronics", "ECE", "electronics and communication"],
  ["mechanical", "ME", "mechanical engineering"],
  ["civil", "CE", "civil engineering"],
  ["electrical", "EEE", "electrical engineering"],
  ["data science", "DS"]
];

const normalizeText = (value) => (typeof value === "string" ? value.trim() : "");

const detectFallbackSkills = (text) => {
  const lowerText = text.toLowerCase();
  const skills = [];

  Object.entries(FALLBACK_SKILLS).forEach(([skillKey, aliases]) => {
    const found = aliases.some((alias) => lowerText.includes(alias.toLowerCase()));
    if (found) {
      skills.push(skillKey.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase()));
    }
  });

  if (skills.length === 0) {
    const genericWords = ["python", "java", "sql", "react", "javascript", "data", "communication"];
    genericWords.forEach((word) => {
      if (lowerText.includes(word) && !skills.includes(word)) {
        skills.push(word.charAt(0).toUpperCase() + word.slice(1));
      }
    });
  }

  return skills;
};

const detectFallbackMinCGPA = (text) => {
  const match = text.match(/cgpa\s*[:=]?\s*(\d+(?:\.\d+)?)/i);
  if (match) {
    const value = Number(match[1]);
    if (value >= 0 && value <= 10) return value;
  }

  const alternateMatch = text.match(/minimum\s+cgpa\s*[:=]?\s*(\d+(?:\.\d+)?)/i);
  if (alternateMatch) {
    const value = Number(alternateMatch[1]);
    if (value >= 0 && value <= 10) return value;
  }

  return null;
};

const detectFallbackBranches = (text) => {
  const lowerText = text.toLowerCase();
  const branches = [];

  FALLBACK_BRANCHES.forEach(([canonical, ...aliases]) => {
    const aliasList = [canonical, ...aliases];
    const matched = aliasList.some((alias) =>
      lowerText.includes(alias.toLowerCase())
    );

    if (matched) {
      branches.push(canonical.charAt(0).toUpperCase() + canonical.slice(1));
    }
  });

  return branches;
};

const detectFallbackGraduationYears = (text) => {
  const matches = [...text.matchAll(/20\d{2}/g)].map((match) => Number(match[0]));
  return [...new Set(matches)];
};

const detectFallbackLocation = (text) => {
  const locationMatch = text.match(/location\s*[:\-]?\s*([A-Za-z][A-Za-z0-9 ,.-]+)/i);
  if (locationMatch) {
    return normalizeText(locationMatch[1]).replace(/\s+/g, " ");
  }

  const baseMatch = text.match(/based\s+in\s+([A-Za-z][A-Za-z0-9 ,.-]+)/i);
  if (baseMatch) {
    return normalizeText(baseMatch[1]).replace(/\s+/g, " ");
  }

  return null;
};

const detectFallbackWorkMode = (text) => {
  const lowerText = text.toLowerCase();

  if (/(remote|work from home|wfh)/i.test(lowerText)) {
    return "Remote";
  }

  if (/(hybrid)/i.test(lowerText)) {
    return "Hybrid";
  }

  if (/(on-site|onsite|office|in-office|work from office)/i.test(lowerText)) {
    return "On-site";
  }

  return null;
};

const parseFallbackRequirements = (jobDescription) => {
  const text = normalizeText(jobDescription || "");
  const lowerText = text.toLowerCase();

  const skills = detectFallbackSkills(text);
  const minCGPA = detectFallbackMinCGPA(text);
  const branches = detectFallbackBranches(text);
  const graduationYears = detectFallbackGraduationYears(text);
  const location = detectFallbackLocation(text);
  const workMode = detectFallbackWorkMode(text);

  const ambiguousOrMissing = [];
  if (skills.length === 0) {
    ambiguousOrMissing.push("Skills requirement not clearly specified");
  }
  if (!minCGPA && !/cgpa/i.test(lowerText)) {
    ambiguousOrMissing.push("CGPA requirement not explicitly mentioned");
  }
  if (branches.length === 0 && /b\.tech|be|bachelor|branch/i.test(lowerText)) {
    ambiguousOrMissing.push("Eligible branches not explicitly specified");
  }

  return {
    skills,
    minCGPA,
    branches,
    graduationYears,
    location,
    workMode,
    additionalNotes: null,
    ambiguousOrMissing
  };
};

const extractRequirementsFromDescription = async (jobDescription) => {
  const prompt = `
You are a placement assistant. Extract structured job requirements from the following job description.

Return ONLY valid JSON in this exact format, with no extra text:

{
  "skills": [],
  "minCGPA": null,
  "branches": [],
  "graduationYears": [],
  "location": null,
  "workMode": null,
  "additionalNotes": null,
  "ambiguousOrMissing": []
}

Rules:
- skills: array of strings
- minCGPA: number between 0 and 10, or null if not mentioned
- branches: array of strings, or empty array
- graduationYears: array of numbers, or empty array
- location: string or null
- workMode: one of "On-site", "Remote", "Hybrid", or null
- additionalNotes: string or null
- ambiguousOrMissing: array of strings describing unclear or missing requirements

Job description:
"""
${jobDescription}
"""
`;

  try {
    const response = await axios.post(
      `${OLLAMA_BASE_URL}/api/generate`,
      {
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        format: "json"
      },
      {
        timeout: 60000
      }
    );

    const rawOutput = response.data.response;

    if (!rawOutput) {
      throw new Error("Ollama returned empty response");
    }

    const parsed = JSON.parse(rawOutput);
    return parsed;
  } catch (error) {
    console.warn(
      "Ollama extraction unavailable, using fallback parser:",
      error.message
    );
    return parseFallbackRequirements(jobDescription);
  }
};

module.exports = {
  extractRequirementsFromDescription
};