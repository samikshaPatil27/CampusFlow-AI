import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";

function JobCreatePage() {
  const [companyName, setCompanyName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [branches, setBranches] = useState("");
  const [minCGPA, setMinCGPA] = useState("");
  const [skills, setSkills] = useState("");
  const [mustHaveSkills, setMustHaveSkills] = useState("");
  const [preferredSkills, setPreferredSkills] = useState("");
  const [preferredSkillThreshold, setPreferredSkillThreshold] = useState("50");
  const [graduationYears, setGraduationYears] = useState("");
  const [location, setLocation] = useState("");
  const [workMode, setWorkMode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const splitValues = (value) =>
    value.split(",").map((item) => item.trim()).filter(Boolean);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    const parsedCGPA = minCGPA === "" ? null : Number(minCGPA);
    const parsedGraduationYears = splitValues(graduationYears).map(Number);

    if (
      (parsedCGPA !== null && (!Number.isFinite(parsedCGPA) || parsedCGPA < 0 || parsedCGPA > 10)) ||
      parsedGraduationYears.some((year) => !Number.isInteger(year) || year < 2000 || year > 2100)
    ) {
      setError("Enter a CGPA between 0 and 10 and valid graduation years.");
      return;
    }

    try {
      const response = await apiClient.post("/jobs", {
        companyName,
        title,
        description,
        deadline,
        extractedRequirements: {
          branches: splitValues(branches),
          minCGPA: parsedCGPA,
          skills: splitValues(skills),
          graduationYears: parsedGraduationYears,
          location: location.trim() || null,
          workMode: workMode || null
        },
        matchingRules: {
          mustHaveSkills: splitValues(mustHaveSkills),
          preferredSkills: splitValues(preferredSkills),
          preferredSkillThreshold: Number(preferredSkillThreshold) / 100
        }
      });
      navigate(`/jobs/${response.data.data.job._id}/review-requirements`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create job");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card profile-card">
        <div className="auth-brand">
          <div className="brand-badge">CF</div>
          <div>
            <p className="eyebrow">CampusFlow AI</p>
            <h1>Create job</h1>
          </div>
        </div>

        <p className="auth-subtitle">
          Add a new placement opportunity and send it through the AI requirement review flow.
        </p>

        <form className="auth-form" onSubmit={handleCreate}>
          <label className="field-label" htmlFor="job-company-name">
            Company name
          </label>
          <input
            id="job-company-name"
            type="text"
            placeholder="Example: Infosys"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />

          <label className="field-label" htmlFor="job-title">
            Job title
          </label>
          <input
            id="job-title"
            type="text"
            placeholder="Example: Software Engineer Intern"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <label className="field-label" htmlFor="job-description">
            Job description
          </label>
          <textarea
            id="job-description"
            placeholder="Describe responsibilities, skills, and eligibility requirements..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <label className="field-label" htmlFor="job-deadline">
            Application deadline
          </label>
          <input
            id="job-deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
          />

          <h2 className="form-section-heading">Eligibility requirements</h2>
          <p className="form-section-help">
            Add known requirements here. You can review and adjust them before opening the job.
          </p>

          <label className="field-label" htmlFor="job-branches">
            Eligible departments / branches
          </label>
          <input
            id="job-branches"
            type="text"
            placeholder="Example: Computer Science, Information Technology"
            value={branches}
            onChange={(e) => setBranches(e.target.value)}
          />

          <label className="field-label" htmlFor="job-min-cgpa">
            Minimum CGPA
          </label>
          <input
            id="job-min-cgpa"
            type="number"
            min="0"
            max="10"
            step="0.01"
            placeholder="Example: 7.5"
            value={minCGPA}
            onChange={(e) => setMinCGPA(e.target.value)}
          />

          <label className="field-label" htmlFor="job-skills">
            Required skills
          </label>
          <input
            id="job-skills"
            type="text"
            placeholder="Example: Java, SQL, communication"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
          />

          <label className="field-label" htmlFor="job-must-have-skills">
            Must-have skills (all required)
          </label>
          <input
            id="job-must-have-skills"
            type="text"
            placeholder="Example: Java, SQL"
            value={mustHaveSkills}
            onChange={(e) => setMustHaveSkills(e.target.value)}
          />

          <label className="field-label" htmlFor="job-preferred-skills">
            Preferred skills
          </label>
          <input
            id="job-preferred-skills"
            type="text"
            placeholder="Example: Spring Boot, AWS"
            value={preferredSkills}
            onChange={(e) => setPreferredSkills(e.target.value)}
          />

          <label className="field-label" htmlFor="job-skill-threshold">
            Preferred skill match threshold (%)
          </label>
          <input
            id="job-skill-threshold"
            type="number"
            min="0"
            max="100"
            value={preferredSkillThreshold}
            onChange={(e) => setPreferredSkillThreshold(e.target.value)}
          />

          <label className="field-label" htmlFor="job-graduation-years">
            Eligible graduation years
          </label>
          <input
            id="job-graduation-years"
            type="text"
            placeholder="Example: 2025, 2026"
            value={graduationYears}
            onChange={(e) => setGraduationYears(e.target.value)}
          />

          <div className="two-column-fields">
            <div>
              <label className="field-label" htmlFor="job-location">Location</label>
              <input
                id="job-location"
                type="text"
                placeholder="Example: Bengaluru"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="job-work-mode">Work mode</label>
              <select
                id="job-work-mode"
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value)}
              >
                <option value="">Not specified</option>
                <option value="On-site">On-site</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button className="primary-button" type="submit">
            Create job
          </button>
        </form>
      </div>
    </div>
  );
}

export default JobCreatePage;