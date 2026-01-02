import React from "react";
import { Link } from "react-router-dom";

const featureCards = [
  {
    title: "Pipeline OS",
    copy: "Drag brands across outreach → negotiation → Amazon-ready. Every stage tracks profit impact.",
  },
  {
    title: "AI Outreach Co-pilot",
    copy: "Two-click Gmail connect, instantly generate first-touch, follow-up, and call scripts with context.",
  },
  {
    title: "Operations Radar",
    copy: "Purchase orders, landed cost, shipments, and invoices live in one timeline so nothing slips.",
  },
  {
    title: "Profit Intelligence",
    copy: "Tie every dollar of spend to deals, see true margin per SKU, and surface stuck cash automatically.",
  },
];

const toolkits = [
  "Command Palette (⌘K)",
  "Team Inbox",
  "PO Builder",
  "Shipment Tracker",
  "Amazon Snapshot",
  "Notes & Reminders",
];

const launchSteps = [
  { label: "Phase 0", detail: "Connect Google + set org profile" },
  { label: "Phase 1", detail: "Pipeline & Contacts live" },
  { label: "Phase 2", detail: "AI Outreach + Automations" },
  { label: "Phase 3", detail: "Orders, Shipments, Finance" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-60 blur-3xl">
          <div className="absolute -top-32 left-1/2 h-64 w-64 rounded-full bg-blue-500/40" />
          <div className="absolute top-40 -left-10 h-80 w-80 rounded-full bg-purple-500/30" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-emerald-500/30" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-10 space-y-16">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white text-slate-900 font-black grid place-items-center">
                LC
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Leverage</p>
                <h1 className="text-xl font-semibold">Amazon Wholesale OS</h1>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Link
                to="/login"
                className="px-4 py-2 rounded-full border border-white/20 text-white hover:border-white transition"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 rounded-full bg-white text-slate-900 font-semibold shadow-lg shadow-white/20"
              >
                Launch Workspace
              </Link>
            </div>
          </header>

          <main className="space-y-16">
            <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-center">
              <div className="space-y-6">
                <p className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-[0.25em] text-slate-300">
                  Phase 0 → Phase 3 Ready
                </p>
                <div>
                  <h2 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
                    Your leverage for brands, logistics, and cash all in one canvas.
                  </h2>
                  <p className="mt-5 text-lg text-slate-300">
                    Spin up deals, auto-draft outreach, raise POs, and see profit reality without juggling ten
                    spreadsheets. Built for Amazon wholesale operators that care about speed.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/signup"
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 font-semibold shadow-2xl shadow-blue-500/40"
                  >
                    Get Started Free
                  </Link>
                  <Link
                    to="/login"
                    className="px-6 py-3 rounded-2xl border border-white/20 text-white hover:bg-white/5 transition"
                  >
                    I already have access →
                  </Link>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                  {["Secure Google Sign-in", "Neon/Postgres ready", "Render + Vercel native"].map((badge) => (
                    <span key={badge} className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl bg-white/5 border border-white/10 p-8 backdrop-blur-xl shadow-2xl shadow-blue-900/40 space-y-6">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Live Control Center</span>
                  <span>Updated now</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Active Deals", value: "24" },
                    { label: "Avg. Margin", value: "29%" },
                    { label: "Shipments in flight", value: "6" },
                    { label: "Open POs", value: "$482k" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase text-slate-400">{stat.label}</p>
                      <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400">
                  *Sample metrics — replace with live data the moment you connect.
                </p>
              </div>
            </section>

            <section className="grid gap-6 sm:grid-cols-2">
              {featureCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-3xl bg-white/5 border border-white/10 p-6 hover:-translate-y-1 transition-transform"
                >
                  <p className="text-sm uppercase tracking-[0.3em] text-blue-200/80">{card.title}</p>
                  <p className="mt-3 text-slate-100 leading-relaxed">{card.copy}</p>
                </div>
              ))}
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Operator Toolkit</h3>
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-300">
                    Built-in accelerators
                  </span>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  {toolkits.map((tool) => (
                    <span
                      key={tool}
                      className="px-4 py-2 rounded-full bg-slate-900/50 border border-white/10 text-sm"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
                <p className="mt-6 text-sm text-slate-300">
                  Every page is optimized for keyboard shortcuts, quick-create modals, and contextual AI assists.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
                <h3 className="text-lg font-semibold text-slate-100">Phase Launch Map</h3>
                <div className="mt-6 space-y-4">
                  {launchSteps.map((step, index) => (
                    <div key={step.label} className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/10 grid place-items-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold">{step.label}</p>
                        <p className="text-sm text-slate-300">{step.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Next</p>
                  <h3 className="text-2xl font-semibold mt-2">Ready to build your command center?</h3>
                  <p className="text-slate-300 mt-2">
                    Deploy backend to Render, connect Neon/Postgres, push Vercel front-end — we already wired the guides.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link
                    to="/signup"
                    className="px-6 py-3 rounded-2xl bg-white text-slate-900 font-semibold shadow-2xl shadow-white/30"
                  >
                    Create workspace
                  </Link>
                  <a
                    href={`${import.meta.env.VITE_API_BASE_URL || "https://api.crm.amzdudes.io"}/docs`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-3 rounded-2xl border border-white/20 text-white hover:bg-white/10 transition"
                  >
                    API docs
                  </a>
                </div>
              </div>
            </section>
          </main>

          <footer className="text-sm text-slate-500 border-t border-white/5 pt-6">
            Render + Neon backend · Vercel frontend · Crafted for Amazon wholesale teams
          </footer>
        </div>
      </div>
    </div>
  );
}
