import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="h-screen flex flex-col items-center justify-center text-center bg-gray-50">
      <h1 className="text-3xl font-bold mb-4">Welcome to Leverage CRM</h1>
      <p className="text-gray-600 mb-6">Manage brands, automate outreach, and track profits.</p>
      <div className="space-x-3">
        <Link to="/login" className="px-4 py-2 bg-blue-600 text-white rounded-xl">
          Login
        </Link>
        <Link to="/signup" className="px-4 py-2 border rounded-xl text-blue-600">
          Sign Up
        </Link>
      </div>
    </div>
  );
}
