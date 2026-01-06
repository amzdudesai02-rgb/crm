import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "./api";
import logo from "./assets/logo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // ✅ When redirected from Google OAuth (token in URL)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    if (token) {
      localStorage.setItem("token", token);
      navigate("/dashboard");
    }
  }, [navigate]);

  // ✅ Manual login
  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    try {
      const res = await api.post("/login", formData);
      localStorage.setItem("token", res.data.access_token);
      navigate("/dashboard");
    } catch (err) {
      alert("Invalid credentials");
    }
  };

  // ✅ Google login redirect
  const handleGoogleLogin = () => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
    window.location.href = `${apiBaseUrl}/login/google`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow to match app theme */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-40 -left-32 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-32 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#020617,_#020617_45%,_#02061700)]" />
      </div>

      <div className="relative max-w-5xl w-full grid gap-10 md:grid-cols-[1.1fr_0.9fr] items-center">
        {/* Brand side */}
        <div className="hidden md:block">
          <div className="flex items-center gap-3 mb-6">
            <img 
              src={logo} 
              alt="amzDUDES Logo" 
              className="h-11 w-auto"
            />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Leverage CRM</p>
              <p className="text-sm text-slate-200">Amazon Wholesale OS</p>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
            Log back into your command center.
          </h1>
          <p className="mt-4 text-slate-300 text-sm md:text-base max-w-md">
            Pick up where you left off – pipeline, outreach, and operations synced across
            Gmail and Seller Central.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 text-xs text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
              <p className="uppercase tracking-[0.25em] text-[10px] text-slate-400">
                Pipeline
              </p>
              <p className="mt-2 text-sm font-semibold">Drag & drop deal stages</p>
              <p className="mt-1 text-[11px] text-slate-400">Stay on top of follow-ups.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
              <p className="uppercase tracking-[0.25em] text-[10px] text-slate-400">
                Outreach
              </p>
              <p className="mt-2 text-sm font-semibold">AI + Gmail wired in</p>
              <p className="mt-1 text-[11px] text-slate-400">Send brand-safe emails fast.</p>
            </div>
          </div>
        </div>

        {/* Auth card */}
        <div className="rounded-3xl bg-slate-950/70 backdrop-blur-xl text-slate-50 shadow-[0_18px_60px_rgba(15,23,42,0.85)] border border-slate-800/80 p-6 md:p-8">
          <h2 className="text-xl font-semibold mb-2 text-center md:text-left">Login</h2>
          <p className="text-sm text-slate-400 mb-6 text-center md:text-left">
            Use your workspace credentials or sign in with Google to jump into Leverage.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">Email</label>
              <input
                type="email"
                placeholder="you@brand.com"
                className="border border-slate-700/70 bg-slate-900/60 rounded-lg px-3 py-2 w-full text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="border border-slate-700/70 bg-slate-900/60 rounded-lg px-3 py-2 w-full text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button className="bg-gradient-to-r from-blue-500 via-sky-500 to-emerald-400 text-slate-950 w-full py-2.5 rounded-lg text-sm font-medium hover:brightness-110 transition shadow-lg shadow-sky-500/30">
              Login
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="h-px flex-1 bg-slate-700" />
            <span className="text-xs text-slate-500 uppercase tracking-[0.25em]">
              Or
            </span>
            <div className="h-px flex-1 bg-slate-700" />
          </div>

          {/* ✅ Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full border border-slate-700/80 bg-slate-900/60 rounded-lg py-2.5 flex items-center justify-center gap-2 text-sm hover:bg-slate-900 transition"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5"
            />
            <span className="text-slate-100">Continue with Google</span>
          </button>

          <p className="text-xs text-center mt-4 text-slate-500">
            Don’t have an account?{" "}
            <Link
              to="/signup"
              className="text-sky-400 font-medium underline-offset-2 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
