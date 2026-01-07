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
    // CRITICAL: Restore token from Gmail OAuth backup FIRST (before any route checks)
    // This must happen synchronously on every route change to prevent logout
    const tokenBackup = sessionStorage.getItem("oauth_token_backup");
    const currentToken = localStorage.getItem("token");
    
    if (tokenBackup && !currentToken) {
      localStorage.setItem("token", tokenBackup);
      console.log("✅ [OAuthTokenHandler] Restored token from Gmail OAuth backup");
      // Don't remove backup yet - let it persist for a moment in case of race conditions
    }
    
    // Check for token in URL query params (from Google OAuth login redirect)
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
    
    // Clean up Gmail OAuth backup after a delay (to ensure all components have checked)
    if (tokenBackup) {
      setTimeout(() => {
        sessionStorage.removeItem("oauth_token_backup");
        sessionStorage.removeItem("gmail_oauth_return_path");
      }, 3000);
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
  // Check for token in localStorage
  let token = localStorage.getItem("token");
  
  // If no token, check if we're returning from Gmail OAuth and restore token
  if (!token) {
    // Check URL params to see if we're returning from OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const isGmailOAuthReturn = urlParams.get("gmail_connected") === "true" || 
                               urlParams.get("gmail_error") ||
                               sessionStorage.getItem("oauth_token_backup");
    
    if (isGmailOAuthReturn) {
      const tokenBackup = sessionStorage.getItem("oauth_token_backup");
      if (tokenBackup) {
        localStorage.setItem("token", tokenBackup);
        token = tokenBackup;
        console.log("✅ [RequireAuth] Restored token from Gmail OAuth backup (synchronously)");
        // Don't remove backup yet - let OAuthTokenHandler clean it up after a delay
      } else {
        console.warn("⚠️ [RequireAuth] Gmail OAuth return detected but no token backup found!");
      }
    }
  }
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const [commandOpen, setCommandOpen] = useState(false);

  // CRITICAL: Restore token from Gmail OAuth backup IMMEDIATELY (before Router renders)
  // This must happen synchronously on every render to prevent logout during OAuth redirect
  (() => {
    // Check if we're returning from Gmail OAuth (by checking URL params or backup)
    const urlParams = new URLSearchParams(window.location.search);
    const isGmailOAuthReturn = urlParams.get("gmail_connected") === "true" || 
                                urlParams.get("gmail_error") ||
                                sessionStorage.getItem("oauth_token_backup");
    
    if (isGmailOAuthReturn) {
      const tokenBackup = sessionStorage.getItem("oauth_token_backup");
      const currentToken = localStorage.getItem("token");
      if (tokenBackup) {
        // Always restore from backup if we're returning from OAuth, even if token exists
        // (in case the token got corrupted or cleared during redirect)
        localStorage.setItem("token", tokenBackup);
        console.log("✅ [App] Restored token from Gmail OAuth backup (returning from OAuth)");
      } else if (!currentToken) {
        console.warn("⚠️ [App] Returning from Gmail OAuth but no token backup found!");
      }
    }
  })();

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
