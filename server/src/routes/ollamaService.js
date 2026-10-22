const axios = require("axios");

const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

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

  let parsed;
  try {
    parsed = JSON.parse(rawOutput);
  } catch (error) {
    throw new Error("Ollama returned invalid JSON");
  }

  return parsed;
};

module.exports = {
  extractRequirementsFromDescription
};