import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await apiClient.post("/auth/login", { email, password });
      const userRole = response.data.data.user.role;
      localStorage.setItem("token", response.data.data.token);
      localStorage.setItem("role", userRole);
      navigate(userRole === "STUDENT" ? "/dashboard" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-badge">CF</div>
          <div>
            <p className="eyebrow">CampusFlow AI</p>
            <h1>Welcome back</h1>
          </div>
        </div>

        <p className="auth-subtitle">
          Sign in to review student matches and manage hiring workflows.
        </p>

        <img
          className="dkte-campus-image"
          src="/dkte-campus.png"
          alt="Historic campus building of D.K.T.E. Society's Textile & Engineering Institute"
        />

        <form className="auth-form" onSubmit={handleLogin}>
          <label className="field-label" htmlFor="login-email">
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            placeholder="you@college.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="field-label" htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="form-error">{error}</p>}

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="auth-switch">
          New student? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;