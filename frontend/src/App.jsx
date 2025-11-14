import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import Home from "./Home";
import Login from "./Login";
import Signup from "./Signup";
import AuthCallback from "./AuthCallback";
import Dashboard from "./Dashboard";
import Profile from "./Profile";
import Pipeline from "./Pipeline";
import AIOutreach from "./AIOutreach";

// Component to handle OAuth token from URL (works on any route)
function OAuthTokenHandler() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for token in URL query params (from Google OAuth redirect)
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get("token");
    
    if (token) {
      // Save token to localStorage
      localStorage.setItem("token", token);
      
      // Remove token from URL for security
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
      
      // Redirect to dashboard
      navigate("/dashboard", { replace: true });
    }
  }, [location.search, navigate]);

  return null; // This component doesn't render anything
}

function App() {
  const token = localStorage.getItem("token");

  return (
    <Router>
      <OAuthTokenHandler />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        {/* OAuth callback from backend */}
        <Route path="/auth/callback/google" element={<AuthCallback />} />
        <Route
          path="/dashboard"
          element={token ? <Dashboard /> : <Navigate to="/login" replace />}
        />
        <Route
           path="/profile"
           element={token ? <Profile /> : <Navigate to="/login" replace />}
        />
        <Route
           path="/pipeline"
           element={token ? <Pipeline /> : <Navigate to="/login" replace />}
        />
        <Route
           path="/ai-outreach"
           element={token ? <AIOutreach /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;
