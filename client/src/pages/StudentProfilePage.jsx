import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";

const emptyForm = {
  fullName: "",
  branch: "",
  graduationYear: "",
  cgpa: "",
  skills: "",
  experience: "",
  resumeText: ""
};

function StudentProfilePage() {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingProfileId, setExistingProfileId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get("/students/profile");
        const profile = response.data.data.profile;
        setExistingProfileId(profile._id || null);

        setForm({
          fullName: profile.fullName || "",
          branch: profile.branch || "",
          graduationYear: profile.graduationYear ?? "",
          cgpa: profile.cgpa ?? "",
          skills: (profile.skills || []).join(", "),
          experience: profile.experience || "",
          resumeText: profile.resumeText || ""
        });
      } catch (err) {
        if (err.response?.status !== 404) {
          setError(err.response?.data?.message || "Unable to load profile");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const payload = {
        fullName: form.fullName,
        branch: form.branch,
        graduationYear: Number(form.graduationYear),
        cgpa: Number(form.cgpa),
        skills: form.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
        experience: form.experience,
        resumeText: form.resumeText
      };

      if (existingProfileId) {
        await apiClient.patch(`/students/profile`, payload);
      } else {
        await apiClient.post("/students/profile", payload);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Profile save failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="dashboard-shell"><p>Loading profile...</p></div>;
  }

  return (
    <div className="auth-page">
      <div className="auth-card profile-card">
        <div className="auth-brand">
          <div className="brand-badge">S</div>
          <div>
            <p className="eyebrow">Student profile</p>
            <h1>Tell us about you</h1>
          </div>
        </div>

        <p className="auth-subtitle">
          Complete your profile so the placement system can match you with the right roles.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="fullName">Full name</label>
          <input id="fullName" name="fullName" value={form.fullName} onChange={handleChange} required />

          <label className="field-label" htmlFor="branch">Branch</label>
          <input id="branch" name="branch" value={form.branch} onChange={handleChange} placeholder="Computer Science" required />

          <div className="two-column-fields">
            <div>
              <label className="field-label" htmlFor="graduationYear">Graduation year</label>
              <input id="graduationYear" name="graduationYear" type="number" value={form.graduationYear} onChange={handleChange} required />
            </div>
            <div>
              <label className="field-label" htmlFor="cgpa">CGPA</label>
              <input id="cgpa" name="cgpa" type="number" step="0.01" min="0" max="10" value={form.cgpa} onChange={handleChange} required />
            </div>
          </div>

          <label className="field-label" htmlFor="skills">Skills</label>
          <input id="skills" name="skills" value={form.skills} onChange={handleChange} placeholder="JavaScript, Python, React" />

          <label className="field-label" htmlFor="experience">Experience</label>
          <textarea id="experience" name="experience" value={form.experience} onChange={handleChange} rows="4" placeholder="Internships, projects, roles, achievements" />

          <label className="field-label" htmlFor="resumeText">Resume text</label>
          <textarea id="resumeText" name="resumeText" value={form.resumeText} onChange={handleChange} rows="5" placeholder="Paste resume summary or project details" />

          {error && <p className="form-error">{error}</p>}

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving profile..." : "Save profile"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default StudentProfilePage;
