import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";

function RequirementReviewPage() {
  const { jobId } = useParams();
  const [requirements, setRequirements] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const extract = async () => {
      try {
        const jobResponse = await apiClient.get(`/jobs/${jobId}`);
        const response = await apiClient.post(
          `/jobs/${jobId}/extract-requirements`
        );
        const extracted = response.data.data.normalizedRequirements;
        const existing = jobResponse.data.data.job.extractedRequirements || {};
        setRequirements({
          ...extracted,
          skills: existing.skills?.length ? existing.skills : extracted.skills,
          branches: existing.branches?.length ? existing.branches : extracted.branches,
          graduationYears: existing.graduationYears?.length
            ? existing.graduationYears
            : extracted.graduationYears,
          minCGPA: typeof existing.minCGPA === "number"
            ? existing.minCGPA
            : extracted.minCGPA,
          location: existing.location || extracted.location,
          workMode: existing.workMode || extracted.workMode,
          additionalNotes: existing.additionalNotes || extracted.additionalNotes
        });
      } catch (err) {
        setError(err.response?.data?.message || "Extraction failed");
      }
    };
    extract();
  }, [jobId]);

  const handleApprove = async () => {
    try {
      await apiClient.post(`/jobs/${jobId}/approve-requirements`, {
        requirements
      });
      navigate(`/jobs/${jobId}/matches`);
    } catch (err) {
      setError(err.response?.data?.message || "Approval failed");
    }
  };

  if (error) {
    return (
      <div className="dashboard-shell">
        <div className="jobs-panel profile-card">
          <p className="form-error">{error}</p>
        </div>
      </div>
    );
  }

  if (!requirements) {
    return (
      <div className="dashboard-shell">
        <div className="jobs-panel profile-card">
          <p className="empty-state">Extracting requirements from the job description...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <div className="jobs-panel profile-card">
        <div className="dashboard-header review-header">
          <div>
            <p className="eyebrow">Approval workflow</p>
            <h1>Review extracted requirements</h1>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/dashboard")}
          >
            Back to dashboard
          </button>
        </div>

        <div className="review-grid">
          {Object.entries(requirements).map(([key, value]) => (
            <div key={key} className="review-card">
              <h3>{key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase())}</h3>
              <pre>{JSON.stringify(value, null, 2)}</pre>
            </div>
          ))}
        </div>

        <div className="dashboard-actions review-actions">
          <button type="button" className="primary-button" onClick={handleApprove}>
            Approve & open job
          </button>
        </div>
      </div>
    </div>
  );
}

export default RequirementReviewPage;