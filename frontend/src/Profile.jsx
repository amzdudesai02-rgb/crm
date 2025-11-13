import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import toast from "react-hot-toast";
import AppHeader from "./components/AppHeader";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ Fetch current user details
  useEffect(() => {
    api
      .get("/users/me")
      .then((res) => {
        setUser(res.data);
        setName(res.data.name);
      })
      .catch((err) => {
        console.error("Profile fetch error:", err);
        localStorage.removeItem("token");
        navigate("/login");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleSave = async () => {
    try {
      await api.put(`/users/${user.id}`, { name }); // future backend update route
      toast.success("Profile updated successfully ✅");
      setUser({ ...user, name });
    } catch {
      toast.error("Update failed. Try again.");
    }
  };

  if (loading) return <div className="p-6 text-gray-500">Loading profile...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <div className="max-w-xl mx-auto bg-white shadow-lg rounded-2xl p-6 mt-10">
        <h1 className="text-xl font-semibold mb-4">Your Profile</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="mt-1 w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Role</label>
            <input
              type="text"
              value={user.role || "Team"}
              disabled
              className="mt-1 w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 rounded-lg border text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
