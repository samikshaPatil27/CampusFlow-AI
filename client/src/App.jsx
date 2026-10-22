import { Link, Navigate, Routes, Route } from "react-router-dom";
import "./App.css";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CoordinatorDashboard from "./pages/CoordinatorDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import StudentProfilePage from "./pages/StudentProfilePage";
import JobCreatePage from "./pages/JobCreatePage";
import RequirementReviewPage from "./pages/RequirementReviewPage";
import StudentMatchPage from "./pages/StudentMatchPage";

const isAuthenticated = () => Boolean(localStorage.getItem("token"));
const getUserRole = () => localStorage.getItem("role") || "STUDENT";

function ProtectedRoute({ children, allowedRoles = [] }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(getUserRole())) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  return isAuthenticated() ? <Navigate to="/dashboard" replace /> : children;
}

function DashboardRouter() {
  const role = getUserRole();

  if (role === "COORDINATOR" || role === "ADMIN") {
    return <CoordinatorDashboard />;
  }

  return <StudentDashboard />;
}

function App() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="site-brand" to="/" aria-label="CampusFlow home">
            <span className="site-brand-badge">CF</span>
            <span>CampusFlow</span>
          </Link>
        </div>
      </header>
      <main className="app-content">
        <Routes>
          <Route path="/" element={<Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />} />
          <Route
            path="/login"
            element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>}
          />
          <Route
            path="/register"
            element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>}
          />
          <Route
            path="/dashboard"
            element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>}
          />
          <Route
            path="/student/profile"
            element={<ProtectedRoute allowedRoles={["STUDENT"]}><StudentProfilePage /></ProtectedRoute>}
          />
          <Route
            path="/jobs/create"
            element={<ProtectedRoute allowedRoles={["COORDINATOR", "ADMIN"]}><JobCreatePage /></ProtectedRoute>}
          />
          <Route
            path="/jobs/:jobId/review-requirements"
            element={<ProtectedRoute allowedRoles={["COORDINATOR", "ADMIN"]}><RequirementReviewPage /></ProtectedRoute>}
          />
          <Route
            path="/jobs/:jobId/matches"
            element={<ProtectedRoute allowedRoles={["COORDINATOR", "ADMIN"]}><StudentMatchPage /></ProtectedRoute>}
          />
          <Route path="*" element={<Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;