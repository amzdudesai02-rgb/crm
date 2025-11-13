import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://127.0.0.1:8000/register", {
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
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSignup} className="bg-white shadow-lg p-6 rounded-xl w-80">
        <h2 className="text-xl font-semibold mb-4 text-center">Sign Up</h2>
        <input
          type="text"
          placeholder="Name"
          className="border rounded-lg px-3 py-2 w-full mb-3"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          type="email"
          placeholder="Email"
          className="border rounded-lg px-3 py-2 w-full mb-3"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          className="border rounded-lg px-3 py-2 w-full mb-4"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button className="bg-blue-600 text-white w-full py-2 rounded-lg">Sign Up</button>
        <p className="text-sm text-center mt-3">
          Already have an account? <Link to="/login" className="text-blue-600">Login</Link>
        </p>
        <button
            type="button"
            onClick={() => (window.location.href = "http://127.0.0.1:8000/login/google")}
             className="w-full border border-gray-300 rounded-lg py-2 flex items-center justify-center gap-2 hover:bg-gray-100"
            >
             <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                className="w-5 h-5"
                    />
                 <span>Sign Up with Google</span>
        </button>
      </form>
    </div>
  );
}
