// src/hooks/useAuthUser.js
import { useEffect, useState } from "react";
import api from "../api";

export default function useAuthUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { 
      setLoading(false); 
      return; 
    }

    api.get("/users/me")
      .then(res => {
        setUser(res.data);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to fetch user:", err);
        console.error("API Base URL:", import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000");
        console.error("Error details:", err.response?.status, err.response?.data, err.message);
        
        // Only remove token on 401 (unauthorized), not on network errors
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          setError("Session expired. Please login again.");
        } else {
          // Network error or other issue - keep token but show error
          setError("Failed to connect to server. Please check your connection.");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return { user, loading, error };
}
