// src/pages/Dashboard.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import AppHeader from "./components/AppHeader";
import useAuthUser from "./hooks/useAuthUser";
// (yahan apne charts/components import kar lo)

export default function Dashboard() {
  const token = localStorage.getItem("token");
  const { loading } = useAuthUser();

  if (!token) return <Navigate to="/login" replace />;
  // optional: loading state dikha do
  if (loading) return <div className="p-6 text-sm text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 👇 yahan tumhara existing Dashboard content aa jayega */}
        <div className="grid gap-6">
          <div className="bg-white border rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-gray-700">Welcome</h3>
            <p className="text-gray-600 text-sm">CRM, AI Outreach & Amazon modules appear here.</p>
          </div>
          {/* ...baaki tumhara UI (KPIs, charts, tabs) ... */}
        </div>
      </div>
    </div>
  );
}
