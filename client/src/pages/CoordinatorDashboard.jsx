import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";

const getJobFormValues = (job) => ({
  companyName: job.companyName,
  title: job.title,
  description: job.description,
  deadline: new Date(job.deadline).toISOString().slice(0, 10),
  branches: (job.extractedRequirements?.branches || []).join(", "),
  minCGPA: job.extractedRequirements?.minCGPA ?? "",
  graduationYears: (job.extractedRequirements?.graduationYears || []).join(", "),
  skills: (job.extractedRequirements?.skills || []).join(", "),
  mustHaveSkills: (job.matchingRules?.mustHaveSkills || job.extractedRequirements?.matchingRules?.mustHaveSkills || []).join(", "),
  preferredSkills: (job.matchingRules?.preferredSkills || job.extractedRequirements?.matchingRules?.preferredSkills || []).join(", "),
  preferredSkillThreshold: Math.round((job.matchingRules?.preferredSkillThreshold ?? job.extractedRequirements?.matchingRules?.preferredSkillThreshold ?? 0.5) * 100)
});

function CoordinatorDashboard() {
  const [jobs, setJobs] = useState([]);
  const [editingJobId, setEditingJobId] = useState(null);
  const [editValues, setEditValues] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [importFeedback, setImportFeedback] = useState("");
  const navigate = useNavigate();

  const fetchJobs = useCallback(async () => {
    const response = await apiClient.get("/jobs");
    setJobs(response.data.data.jobs);
  }, []);

  useEffect(() => {
    let isCurrent = true;
    apiClient
      .get("/jobs")
      .then((response) => {
        if (isCurrent) setJobs(response.data.data.jobs);
      })
      .catch((err) => {
        if (isCurrent) {
          setError(err.response?.data?.message || "Failed to fetch jobs");
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login", { replace: true });
  };

  const startEditing = (job) => {
    setError("");
    setEditingJobId(job._id);
    setEditValues(getJobFormValues(job));
  };

  const cancelEditing = () => {
    setEditingJobId(null);
    setEditValues(null);
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditValues((current) => ({ ...current, [name]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!editingJobId || !editValues) return;

    setSaving(true);
    setError("");
    try {
      const split = (value) => value.split(",").map((item) => item.trim()).filter(Boolean);
      await apiClient.patch(`/jobs/${editingJobId}`, {
        companyName: editValues.companyName,
        title: editValues.title,
        description: editValues.description,
        deadline: editValues.deadline,
        extractedRequirements: {
          ...(jobs.find((job) => job._id === editingJobId)?.extractedRequirements || {}),
          branches: split(editValues.branches),
          minCGPA: editValues.minCGPA === "" ? null : Number(editValues.minCGPA),
          graduationYears: split(editValues.graduationYears).map(Number),
          skills: split(editValues.skills)
        },
        matchingRules: {
          mustHaveSkills: split(editValues.mustHaveSkills),
          preferredSkills: split(editValues.preferredSkills),
          preferredSkillThreshold: Number(editValues.preferredSkillThreshold) / 100
        }
      });
      cancelEditing();
      await fetchJobs();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update job");
    } finally {
      setSaving(false);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImportFeedback("");
    setError("");
    try {
      const csv = await file.text();
      const response = await apiClient.post("/students/import", { csv });
      const { imported, errors: rowErrors } = response.data.data;
      setImportFeedback(
        `Imported ${imported} profile(s).${rowErrors.length ? ` ${rowErrors.length} row(s) need attention.` : ""}`
      );
      if (rowErrors.length) {
        setError(rowErrors.map((row) => `Row ${row.row}: ${row.message}`).join(" "));
      }
    } catch (err) {
      setError(err.response?.data?.message || "Student import failed");
    }
  };

  const handleExport = async () => {
    try {
      const response = await apiClient.get("/students/export", { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = "campusflow-students.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || "Student export failed");
    }
  };

  const handleDelete = async (job) => {
    if (!window.confirm(`Delete ${job.title} at ${job.companyName}?`)) return;

    setError("");
    try {
      await apiClient.delete(`/jobs/${job._id}`);
      setJobs((currentJobs) => currentJobs.filter((item) => item._id !== job._id));
      if (editingJobId === job._id) cancelEditing();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete job");
    }
  };

  return (
    <div className="dashboard-shell">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Coordinator</p>
          <h1>Dashboard</h1>
        </div>
        <button className="secondary-button" type="button" onClick={handleLogout}>
          Log out
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="dashboard-actions">
        <Link className="primary-button dashboard-button" to="/jobs/create">
          Create New Job
        </Link>
        <div className="student-data-actions">
          <label className="secondary-button dashboard-button">
            Import student CSV
            <input type="file" accept=".csv,text/csv" onChange={handleImport} hidden />
          </label>
          <button className="secondary-button dashboard-button" type="button" onClick={handleExport}>
            Export students CSV
          </button>
        </div>
      </div>

      {importFeedback && <p className="success-message">{importFeedback}</p>}
      <div className="jobs-panel">
        <h2>Openings</h2>
        {jobs.length === 0 ? (
          <p className="empty-state">No jobs created yet.</p>
        ) : (
          <ul className="job-list">
            {jobs.map((job) => {
              const actionPath =
                job.status === "OPEN" || job.status === "CLOSED"
                  ? `/jobs/${job._id}/matches`
                  : `/jobs/${job._id}/review-requirements`;
              const isEditing = editingJobId === job._id;

              return (
                <li key={job._id} className="job-item">
                  {isEditing ? (
                    <form className="job-edit-form" onSubmit={handleSave}>
                      <label>
                        Company name
                        <input
                          name="companyName"
                          value={editValues.companyName}
                          onChange={handleEditChange}
                          maxLength={150}
                          required
                        />
                      </label>
                      <label>
                        Job title
                        <input
                          name="title"
                          value={editValues.title}
                          onChange={handleEditChange}
                          maxLength={150}
                          required
                        />
                      </label>
                      <label>
                        Description
                        <textarea
                          name="description"
                          value={editValues.description}
                          onChange={handleEditChange}
                          maxLength={10000}
                          required
                        />
                      </label>
                      <label>
                        Application deadline
                        <input
                          name="deadline"
                          type="date"
                          value={editValues.deadline}
                          onChange={handleEditChange}
                          required
                        />
                      </label>
                      <label>Eligible departments (comma-separated)
                        <input name="branches" value={editValues.branches} onChange={handleEditChange} />
                      </label>
                      <label>Minimum CGPA
                        <input name="minCGPA" type="number" min="0" max="10" step="0.01" value={editValues.minCGPA} onChange={handleEditChange} />
                      </label>
                      <label>Graduation years (comma-separated)
                        <input name="graduationYears" value={editValues.graduationYears} onChange={handleEditChange} />
                      </label>
                      <label>Extracted skills (comma-separated)
                        <input name="skills" value={editValues.skills} onChange={handleEditChange} />
                      </label>
                      <label>Must-have skills (comma-separated)
                        <input name="mustHaveSkills" value={editValues.mustHaveSkills} onChange={handleEditChange} />
                      </label>
                      <label>Preferred skills (comma-separated)
                        <input name="preferredSkills" value={editValues.preferredSkills} onChange={handleEditChange} />
                      </label>
                      <label>Preferred skill threshold (%)
                        <input name="preferredSkillThreshold" type="number" min="0" max="100" value={editValues.preferredSkillThreshold} onChange={handleEditChange} />
                      </label>
                      <div className="job-controls">
                        <button className="primary-button" type="submit" disabled={saving}>
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button className="secondary-button" type="button" onClick={cancelEditing}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="job-details">
                        <strong>{job.title}</strong>
                        <span>{job.companyName} · {job.status}</span>
                        <span>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                      </div>
                      <div className="job-actions">
                        <Link className="review-job-button" to={`/jobs/${job._id}/review-requirements`}>
                          Review Requirements
                        </Link>
                        {job.status === "OPEN" || job.status === "CLOSED" ? (
                          <Link className="view-matches-link" to={actionPath}>View Matches</Link>
                        ) : null}
                        <div className="job-management-buttons">
                          <button className="secondary-button" type="button" onClick={() => startEditing(job)}>
                          Edit
                          </button>
                          <button className="danger-button" type="button" onClick={() => handleDelete(job)}>
                          Delete
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default CoordinatorDashboard;
