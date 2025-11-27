import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import toast from "react-hot-toast";
import api from "../api";

export default function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuthUser();

  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const initials = (user?.name || user?.email || "?")
    .split(" ")
    .map((s) => s[0]?.toUpperCase())
    .slice(0, 2)
    .join("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.success("Logout successful 👋");
    setTimeout(() => {
      navigate("/", { replace: true });
    }, 1000);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
      setResults(res.data);
    } catch {
      toast.error("Search failed");
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* ---- Logo ---- */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          <div className="w-9 h-9 rounded-xl bg-gray-900 text-white grid place-items-center font-bold">
            LC
          </div>
          <div>
            <h1 className="text-lg font-semibold">Leverage CRM</h1>
            <p className="text-xs text-gray-500">
              Command center for Amazon wholesale
            </p>
          </div>
        </div>

        {/* ---- Primary Nav ---- */}
        <nav className="hidden lg:flex items-center gap-3 text-sm font-medium">
          {[
            { label: "Dashboard", path: "/dashboard" },
            { label: "Operations", path: "/operations" },
            { label: "Intelligence", path: "/intelligence" },
            { label: "AI Outreach", path: "/ai-outreach" },
          ].map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-full transition ${
                  isActive
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* ---- Global Search ---- */}
        <form onSubmit={handleSearch} className="relative w-72 hidden md:block">
          <input
            type="text"
            placeholder="Search deals, contacts, brands..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border rounded-lg px-3 py-1 text-sm"
          />
          {results.deals && (
            <div className="absolute bg-white border w-full mt-1 rounded-lg max-h-60 overflow-auto text-sm z-50">
              {[...(results.deals || []), ...(results.contacts || []), ...(results.companies || [])].map(
                (item, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setQuery("");
                      setResults([]);
                      toast.success(`Opened ${item.title || item.name}`);
                    }}
                    className="px-3 py-1 hover:bg-gray-100 cursor-pointer"
                  >
                    {item.title || item.name}
                  </div>
                )
              )}
            </div>
          )}
        </form>

        {/* ---- User Info + Menu ---- */}
        <div className="relative flex items-center gap-3">
          {!loading && user && (
            <>
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium">{user.name || "User"}</div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>

              <div
                className="w-10 h-10 rounded-full bg-gray-200 grid place-items-center font-semibold cursor-pointer select-none hover:bg-gray-300 transition"
                onClick={() => setMenuOpen(!menuOpen)}
                title="Profile menu"
              >
                {initials}
              </div>
            </>
          )}

          {menuOpen && (
            <div className="absolute right-0 top-12 bg-white border shadow-lg rounded-xl w-40 z-50">
              <button
                onClick={() => {
                  navigate("/profile");
                  setMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
              >
                View Profile
              </button>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
