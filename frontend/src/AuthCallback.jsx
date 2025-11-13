import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    if (token) {
      localStorage.setItem("token", token);
      // remove token from URL for cleanliness
      const newUrl = window.location.origin + "/";
      window.history.replaceState({}, document.title, newUrl);
      navigate("/dashboard");
    } else {
      // no token - go to login
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">Signing you in…</div>
    </div>
  );
}
