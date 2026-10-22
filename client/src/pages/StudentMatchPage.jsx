import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import apiClient from "../api/apiClient";

const stages = ["SHORTLISTED", "CONTACTED", "INTERVIEW", "OFFER", "REJECTED"];

function StudentMatchPage() {
  const { jobId } = useParams();
  const [matches, setMatches] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [draftEdits, setDraftEdits] = useState({});
  const [communicationType, setCommunicationType] = useState("shortlist");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const fetchData = useCallback(async () => {
    const [matchResponse, auditResponse] = await Promise.all([
      apiClient.get(`/jobs/${jobId}/matches`),
      apiClient.get(`/jobs/${jobId}/audit`)
    ]);
    setMatches(matchResponse.data.data.matches);
    setAuditLogs(auditResponse.data.data.logs);
  }, [jobId]);

  useEffect(() => {
    let current = true;
    Promise.all([
      apiClient.get(`/jobs/${jobId}/matches`),
      apiClient.get(`/jobs/${jobId}/audit`)
    ])
      .then(([matchResponse, auditResponse]) => {
        if (!current) return;
        setMatches(matchResponse.data.data.matches);
        setAuditLogs(auditResponse.data.data.logs);
      })
      .catch((err) => {
        if (current) setError(err.response?.data?.message || "Failed to load job candidates");
      });
    return () => {
      current = false;
    };
  }, [jobId]);

  const updateCandidate = async (match, updates) => {
    setError("");
    setNotice("");
    try {
      await apiClient.patch(`/jobs/${jobId}/candidates/${match.studentId}`, updates);
      await fetchData();
      setNotice("Candidate record updated.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update candidate record");
    }
  };

  const toggleSelected = (studentId) => {
    setSelectedStudentIds((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId]
    );
  };

  const createDrafts = async () => {
    if (!selectedStudentIds.length) {
      setError("Select at least one student using the checkbox beside their name.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await apiClient.post(`/jobs/${jobId}/candidates/communications`, {
        studentIds: selectedStudentIds,
        type: communicationType
      });
      setSelectedStudentIds([]);
      await fetchData();
      setNotice(`Created ${response.data.data.drafts.length} template draft(s). Review each and open it in your email app when ready.`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate communication drafts");
    } finally {
      setBusy(false);
    }
  };

  const markSent = async (match) => {
    setError("");
    try {
      if (draftEdits[match.studentId] !== undefined) {
        await apiClient.patch(`/jobs/${jobId}/candidates/${match.studentId}/communication`, {
          draft: draftEdits[match.studentId]
        });
      }
      await apiClient.post(`/jobs/${jobId}/candidates/${match.studentId}/communication-sent`);
      await fetchData();
      setNotice(`Marked draft for ${match.fullName} as sent.`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update communication status");
    }
  };

  const saveDraft = async (match) => {
    try {
      await apiClient.patch(`/jobs/${jobId}/candidates/${match.studentId}/communication`, {
        draft: draftEdits[match.studentId] ?? match.tracking.communicationDraft
      });
      await fetchData();
      setNotice(`Saved reviewed draft for ${match.fullName}.`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save communication draft");
    }
  };

  const openEmailDraft = (match) => {
    const tracking = match.tracking;
    if (!match.email || !tracking?.communicationDraft) {
      setError("This student has no email address or saved draft.");
      return;
    }

    const body = draftEdits[match.studentId] ?? tracking.communicationDraft;
    const subject = tracking.communicationSubject || "Campus placement update";
    window.location.href =
      `mailto:${encodeURIComponent(match.email)}` +
      `?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setNotice(`Opened an email draft for ${match.fullName}. Send it from your email app, then mark it sent here.`);
  };

  if (error && !matches.length) {
    return (
      <div className="dashboard-shell">
        <div className="jobs-panel profile-card"><p className="form-error">{error}</p></div>
      </div>
    );
  }

  const eligibleCount = matches.filter((match) => match.eligible).length;

  return (
    <div className="dashboard-shell">
      <div className="jobs-panel profile-card">
        <div className="dashboard-header review-header">
          <div>
            <p className="eyebrow">Match review</p>
            <h1>Student matches</h1>
          </div>
          <Link className="secondary-button dashboard-button" to="/dashboard">Back to dashboard</Link>
        </div>

        {error && <p className="form-error">{error}</p>}
        {notice && <p className="success-message">{notice}</p>}

        <div className="summary-row">
          <div className="summary-card"><span>Total students</span><strong>{matches.length}</strong></div>
          <div className="summary-card success-card"><span>Eligible</span><strong>{eligibleCount}</strong></div>
          <div className="summary-card warning-card"><span>Not eligible</span><strong>{matches.length - eligibleCount}</strong></div>
        </div>

        <div className="communication-toolbar">
          <label>
            Draft type
            <select value={communicationType} onChange={(event) => setCommunicationType(event.target.value)}>
              <option value="shortlist">Shortlist</option>
              <option value="interview-invite">Interview invite</option>
              <option value="rejection">Rejection</option>
              <option value="general">General</option>
            </select>
          </label>
          <div className="draft-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => setSelectedStudentIds(matches.filter((match) => match.eligible).map((match) => match.studentId))}
              disabled={busy || !matches.some((match) => match.eligible)}
            >
              Select eligible
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => setSelectedStudentIds([])}
              disabled={busy || !selectedStudentIds.length}
            >
              Clear selection
            </button>
            <button className="primary-button" type="button" onClick={createDrafts} disabled={busy || !matches.length}>
            {busy ? "Generating..." : `Draft for selected (${selectedStudentIds.length})`}
            </button>
          </div>
        </div>
        <div className="match-list">
          {matches.length === 0 ? (
            <p className="empty-state">No student profiles are available for matching yet.</p>
          ) : matches.map((match) => {
            const tracking = match.tracking || {};
            return (
              <div key={match.studentId} className={`match-card ${match.eligible ? "eligible" : "ineligible"}`}>
                <div className="match-header">
                  <div className="candidate-title">
                    <label className="candidate-select">
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(match.studentId)}
                        onChange={() => toggleSelected(match.studentId)}
                      />
                      <strong>{match.fullName}</strong>
                    </label>
                    {match.email && <span>{match.email}</span>}
                    <span>{match.branch} • {match.graduationYear} • CGPA {match.cgpa}</span>
                  </div>
                  <span className={`status-pill ${match.eligible ? "eligible-pill" : "ineligible-pill"}`}>
                    {match.eligible ? "Eligible" : "Not eligible"}
                  </span>
                </div>

                <div className="match-meta"><span>Skills: {(match.skills || []).join(", ") || "No skills listed"}</span></div>
                <div className="match-reasons"><strong>Reasons:</strong> {match.reasons.join("; ") || "No matching reasons recorded."}</div>
                {match.failures.length > 0 && <div className="match-failures"><strong>Failures:</strong> {match.failures.join("; ")}</div>}

                <div className="candidate-actions">
                  <label>
                    Pipeline stage
                    <select value={tracking.stage || ""} onChange={(event) => updateCandidate(match, { stage: event.target.value })}>
                      <option value="" disabled>Choose stage</option>
                      {stages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
                    </select>
                  </label>
                  <label>
                    Match feedback
                    <select value={tracking.feedback || ""} onChange={(event) => updateCandidate(match, { feedback: event.target.value, feedbackReason: tracking.feedbackReason || "" })}>
                      <option value="" disabled>Rate this match</option>
                      <option value="USEFUL">Useful</option>
                      <option value="INCORRECT">Incorrect</option>
                    </select>
                  </label>
                  <label className="feedback-reason">
                    Feedback reason
                    <input
                      type="text"
                      maxLength={1000}
                      defaultValue={tracking.feedbackReason || ""}
                      placeholder="Why is this match useful or incorrect?"
                      onBlur={(event) => {
                        if (tracking.feedback) {
                          updateCandidate(match, { feedback: tracking.feedback, feedbackReason: event.target.value });
                        }
                      }}
                    />
                  </label>
                </div>

                {tracking.communicationDraft && (
                  <div className="communication-draft">
                    <div className="match-header">
                      <strong>{tracking.communicationSubject || tracking.communicationType} · {tracking.communicationStatus}</strong>
                    </div>
                    <textarea
                      readOnly={tracking.communicationStatus !== "DRAFT"}
                      value={draftEdits[match.studentId] ?? tracking.communicationDraft}
                      onChange={(event) => setDraftEdits((current) => ({
                        ...current,
                        [match.studentId]: event.target.value
                      }))}
                      aria-label={`Communication draft for ${match.fullName}`}
                    />
                    {tracking.communicationStatus === "DRAFT" && (
                      <>
                        <span className="form-section-help">Edit and save the reviewed message, then send it yourself using your mail client.</span>
                        <div className="job-controls">
                          <button type="button" className="secondary-button" onClick={() => saveDraft(match)}>Save reviewed draft</button>
                          <button type="button" className="secondary-button" onClick={() => openEmailDraft(match)}>Open in email app</button>
                          <button type="button" className="primary-button" onClick={() => markSent(match)}>Mark as sent</button>
                        </div>
                      </>
                    )}
                    {tracking.communicationStatus === "SENT" && (
                      <span className="form-section-help">Marked as sent by the coordinator.</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <section className="audit-section">
          <h2>Job activity history</h2>
          {!auditLogs.length ? <p className="empty-state">No activity recorded yet.</p> : (
            <ul className="audit-list">
              {auditLogs.map((log) => (
                <li key={log._id}>
                  <strong>{log.action.replaceAll("_", " ")}</strong>
                  <span>{log.actorId?.name || log.actorId?.email || "User"} · {new Date(log.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default StudentMatchPage;
