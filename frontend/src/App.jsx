import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./Home";
import Login from "./Login";
import Signup from "./Signup";
import AuthCallback from "./AuthCallback";
import Dashboard from "./Dashboard";
import Profile from "./Profile";
import Pipeline from "./Pipeline";
import AIOutreach from "./AIOutreach";


function App() {
  const token = localStorage.getItem("token");

  return (
    <Router>
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
