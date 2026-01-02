import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import Home from "./Home";
import Login from "./Login";
import Signup from "./Signup";
import AuthCallback from "./AuthCallback";
import Dashboard from "./Dashboard";
import Profile from "./Profile";
import Pipeline from "./Pipeline";
import AIOutreach from "./AIOutreach";
import Operations from "./Operations";
import Intelligence from "./Intelligence";

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

// Global keyboard listener for Cmd/Ctrl+K
function CommandPaletteKeyListener({ onOpen }) {
  useEffect(() => {
    const handler = (e) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpen();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onOpen]);
  return null;
}

function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();

  if (!open) return null;

  const actions = [
    { label: "Go to Dashboard", path: "/dashboard" },
    { label: "Open Pipeline", path: "/pipeline" },
    { label: "Open AI Outreach", path: "/ai-outreach" },
    { label: "Open Operations", path: "/operations" },
    { label: "Open Intelligence", path: "/intelligence" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-24">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-2">
          <input
            autoFocus
            placeholder="Jump to anywhere… (Dashboard, Pipeline, Outreach)"
            className="w-full border-none outline-none text-sm py-1"
          />
        </div>
        <div className="max-h-64 overflow-y-auto">
          {actions.map((action) => (
            <button
              key={action.path}
              type="button"
              onClick={() => {
                navigate(action.path);
                onClose();
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
            >
              {action.label}
            </button>
          ))}
        </div>
        <div className="border-t border-gray-100 px-4 py-1 text-[11px] text-gray-400 flex justify-between">
          <span>Use Cmd/Ctrl + K to open</span>
          <button type="button" onClick={onClose}>
            Esc
          </button>
        </div>
      </div>
    </div>
  );
}

// Simple auth gate that always reads latest token from localStorage
function RequireAuth({ children }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <Router>
      <OAuthTokenHandler />
      {/* Simple command palette (Cmd/Ctrl+K) */}
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
      <CommandPaletteKeyListener onOpen={() => setCommandOpen(true)} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
  {/* OAuth callback from backend */}
  <Route path="/auth/callback/google" element={<AuthCallback />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
           path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />
        <Route
           path="/pipeline"
          element={
            <RequireAuth>
              <Pipeline />
            </RequireAuth>
          }
        />
        <Route
           path="/ai-outreach"
          element={
            <RequireAuth>
              <AIOutreach />
            </RequireAuth>
          }
        />
        <Route
          path="/operations"
          element={
            <RequireAuth>
              <Operations />
            </RequireAuth>
          }
        />
        <Route
          path="/intelligence"
          element={
            <RequireAuth>
              <Intelligence />
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
