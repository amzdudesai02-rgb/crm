import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "./api";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await api.post("/register", {
        ...form,
        role: "Team",
      });
      alert("Signup successful! Please login.");
      navigate("/login");
    } catch {
      alert("Signup failed. Try another email.");
    }
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
        {/* Brand / story */}
        <div className="hidden md:block">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-white text-slate-900 font-black grid place-items-center shadow-lg shadow-blue-500/40">
              LC
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Leverage CRM</p>
              <p className="text-sm text-slate-200">Amazon Wholesale OS</p>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
            Create your Leverage workspace.
          </h1>
          <p className="mt-4 text-slate-300 text-sm md:text-base max-w-md">
            Designed for operators who live in Gmail, spreadsheets, and Seller Central –
            but want everything stitched together into one command center.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-slate-300">
            <li>• Pipeline + outreach in one view</li>
            <li>• Purchase orders, shipments, and invoices in the same lane</li>
            <li>• Profit intelligence that actually matches your bank</li>
          </ul>
        </div>

        {/* Signup card */}
        <div className="rounded-3xl bg-slate-950/70 backdrop-blur-xl text-slate-50 shadow-[0_18px_60px_rgba(15,23,42,0.85)] border border-slate-800/80 p-6 md:p-8">
          <h2 className="text-xl font-semibold mb-2 text-center md:text-left">Sign up</h2>
          <p className="text-sm text-slate-400 mb-6 text-center md:text-left">
            Create a workspace for your team. You can invite other operators later.
          </p>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">Name</label>
              <input
                type="text"
                placeholder="Your name"
                className="border border-slate-700/70 bg-slate-900/60 rounded-lg px-3 py-2 w-full text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">Email</label>
              <input
                type="email"
                placeholder="you@brand.com"
                className="border border-slate-700/70 bg-slate-900/60 rounded-lg px-3 py-2 w-full text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">Password</label>
              <input
                type="password"
                placeholder="Create a strong password"
                className="border border-slate-700/70 bg-slate-900/60 rounded-lg px-3 py-2 w-full text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <button className="bg-gradient-to-r from-blue-500 via-sky-500 to-emerald-400 text-slate-950 w-full py-2.5 rounded-lg text-sm font-medium hover:brightness-110 transition shadow-lg shadow-sky-500/30">
              Create workspace
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="h-px flex-1 bg-slate-700" />
            <span className="text-xs text-slate-500 uppercase tracking-[0.25em]">
              Or
            </span>
            <div className="h-px flex-1 bg-slate-700" />
          </div>

          <button
            type="button"
            onClick={() => {
              const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
              window.location.href = `${apiBaseUrl}/login/google`;
            }}
            className="w-full border border-slate-700/80 bg-slate-900/60 rounded-lg py-2.5 flex items-center justify-center gap-2 text-sm hover:bg-slate-900 transition"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5"
            />
            <span className="text-slate-100">Sign up with Google</span>
          </button>

          <p className="text-xs text-center mt-4 text-slate-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-sky-400 font-medium underline-offset-2 hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
