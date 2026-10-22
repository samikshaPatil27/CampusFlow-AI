import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";

function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get("/students/profile");
        setProfile(response.data.data.profile);
      } catch (err) {
        if (err.response?.status === 404) {
          setProfile(null);
          return;
        }
        setError(err.response?.data?.message || "Failed to load profile");
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login", { replace: true });
  };

  return (
    <div className="dashboard-shell">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Student</p>
          <h1>Dashboard</h1>
        </div>
        <button className="secondary-button" type="button" onClick={handleLogout}>
          Log out
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      {!profile ? (
        <div className="jobs-panel">
          <h2>Your profile is not ready</h2>
          <p className="empty-state">
            Create your student profile to get matched with relevant placement opportunities.
          </p>
          <div className="dashboard-actions">
            <Link className="primary-button dashboard-button" to="/student/profile">
              Create profile
            </Link>
          </div>
        </div>
      ) : (
        <div className="jobs-panel">
          <h2>My profile</h2>
          <div className="profile-summary">
            <p><strong>Name:</strong> {profile.fullName}</p>
            <p><strong>Branch:</strong> {profile.branch}</p>
            <p><strong>Graduation year:</strong> {profile.graduationYear}</p>
            <p><strong>CGPA:</strong> {profile.cgpa}</p>
            <p><strong>Skills:</strong> {(profile.skills || []).join(", ") || "Not listed"}</p>
          </div>

          <div className="dashboard-actions">
            <Link className="secondary-button dashboard-button" to="/student/profile">
              Update profile
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;
