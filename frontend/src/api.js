// src/api.js
import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
console.log("🔗 API Base URL:", baseURL);

const api = axios.create({
  baseURL,
});

// 🔐 Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 🚪 Handle 401 → auto logout (but preserve token during OAuth flow)
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      // Check if we're in the middle of an OAuth flow (redirect back from Gmail)
      const urlParams = new URLSearchParams(window.location.search);
      const isOAuthReturn = urlParams.get("gmail_connected") === "true" || 
                          urlParams.get("gmail_error") || 
                          sessionStorage.getItem("oauth_token_backup");
      
      // If we have a token backup, try to restore it first
      if (isOAuthReturn) {
        const tokenBackup = sessionStorage.getItem("oauth_token_backup");
        if (tokenBackup) {
          localStorage.setItem("token", tokenBackup);
          console.log("✅ Restored token from OAuth backup in API interceptor");
          // Retry the request - but we can't do that here, so just don't clear token
          return Promise.reject(err);
        }
      }
      
      // Only clear token and redirect if not in OAuth flow
      if (!isOAuthReturn) {
        localStorage.removeItem("token");
        // hard redirect so app state clears
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
