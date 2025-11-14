// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import AppHeader from "./components/AppHeader";
import useAuthUser from "./hooks/useAuthUser";
import api from "./api";

export default function Dashboard() {
  const token = localStorage.getItem("token");
  const { loading, user } = useAuthUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({ deals: 0, contacts: 0, companies: 0, revenue: 0 });
  const [recentDeals, setRecentDeals] = useState([]);
  const [recentContacts, setRecentContacts] = useState([]);

  useEffect(() => {
    if (token) {
      // Load dashboard stats
      Promise.all([
        api.get("/pipeline/deals").catch(() => ({ data: [] })),
        api.get("/contacts").catch(() => ({ data: [] })),
        api.get("/companies").catch(() => ({ data: [] })),
        api.get("/profit").catch(() => ({ data: { profit: 0 } })),
      ]).then(([dealsRes, contactsRes, companiesRes, profitRes]) => {
        const deals = dealsRes.data || [];
        const contacts = contactsRes.data || [];
        const companies = companiesRes.data || [];
        const totalRevenue = deals.reduce((sum, deal) => sum + (Number(deal.value) || 0), 0);
        
        setStats({
          deals: deals.length,
          contacts: contacts.length,
          companies: companies.length,
          revenue: totalRevenue,
        });
        
        // Get recent deals (last 5)
        setRecentDeals(deals.slice(0, 5));
        setRecentContacts(contacts.slice(0, 5));
      });
    }
  }, [token]);

  if (!token) return <Navigate to="/login" replace />;
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "pipeline", label: "Pipeline", icon: "📋" },
    { id: "contacts", label: "Contacts", icon: "👥" },
    { id: "companies", label: "Companies", icon: "🏢" },
    { id: "outreach", label: "AI Outreach", icon: "✉️" },
    { id: "amazon", label: "Amazon", icon: "📦" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name || "User"}! 👋
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Manage your Amazon wholesale operations from one place
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Total Deals</div>
            <div className="text-2xl font-bold text-gray-900">{stats.deals}</div>
          </div>
          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Contacts</div>
            <div className="text-2xl font-bold text-gray-900">{stats.contacts}</div>
          </div>
          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Companies</div>
            <div className="text-2xl font-bold text-gray-900">{stats.companies}</div>
          </div>
          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Total Revenue</div>
            <div className="text-2xl font-bold text-green-600">
              ${stats.revenue.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white border rounded-xl p-1 mb-6 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === "pipeline") {
                  navigate("/pipeline");
                } else if (tab.id === "outreach") {
                  navigate("/ai-outreach");
                } else {
                  setActiveTab(tab.id);
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white border rounded-xl p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Overview</h2>
              
              {/* Recent Deals */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Recent Deals</h3>
                  <button
                    onClick={() => navigate("/pipeline")}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View All →
                  </button>
                </div>
                {recentDeals.length > 0 ? (
                  <div className="space-y-2">
                    {recentDeals.map((deal) => (
                      <div
                        key={deal.id}
                        onClick={() => navigate("/pipeline")}
                        className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">{deal.title}</div>
                            <div className="text-xs text-gray-500">
                              ${Number(deal.value || 0).toLocaleString()}
                            </div>
                          </div>
                          {deal.due_date && (
                            <div className="text-xs text-gray-400">
                              Due: {new Date(deal.due_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">No deals yet</p>
                    <button
                      onClick={() => navigate("/pipeline")}
                      className="mt-2 text-sm text-blue-600 hover:underline"
                    >
                      Create your first deal →
                    </button>
                  </div>
                )}
              </div>

              {/* Recent Contacts */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Recent Contacts</h3>
                  <button
                    onClick={() => setActiveTab("contacts")}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View All →
                  </button>
                </div>
                {recentContacts.length > 0 ? (
                  <div className="space-y-2">
                    {recentContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="border rounded-lg p-3 hover:bg-gray-50"
                      >
                        <div className="font-medium text-sm">{contact.name}</div>
                        <div className="text-xs text-gray-500">{contact.email}</div>
                        {contact.phone && (
                          <div className="text-xs text-gray-400">{contact.phone}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">No contacts yet</p>
                    <button
                      onClick={() => setActiveTab("contacts")}
                      className="mt-2 text-sm text-blue-600 hover:underline"
                    >
                      Add your first contact →
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => navigate("/pipeline")}
                    className="border rounded-lg p-3 text-sm hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-lg mb-1">📋</div>
                    <div className="font-medium">New Deal</div>
                  </button>
                  <button
                    onClick={() => setActiveTab("contacts")}
                    className="border rounded-lg p-3 text-sm hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-lg mb-1">👤</div>
                    <div className="font-medium">Add Contact</div>
                  </button>
                  <button
                    onClick={() => setActiveTab("companies")}
                    className="border rounded-lg p-3 text-sm hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-lg mb-1">🏢</div>
                    <div className="font-medium">Add Company</div>
                  </button>
                  <button
                    onClick={() => navigate("/ai-outreach")}
                    className="border rounded-lg p-3 text-sm hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-lg mb-1">✉️</div>
                    <div className="font-medium">Send Email</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "contacts" && <ContactsTab />}
          {activeTab === "companies" && <CompaniesTab />}
          {activeTab === "amazon" && <AmazonTab />}
        </div>
      </div>
    </div>
  );
}

// Contacts Tab Component
function ContactsTab() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
  });

  useEffect(() => {
    api
      .get("/contacts")
      .then((res) => setContacts(res.data))
      .catch(() => setContacts([]))
      .finally(() => setLoading(false));
  }, []);

  const handleAddContact = async (e) => {
    e.preventDefault();
    try {
      await api.post("/contacts", newContact);
      const res = await api.get("/contacts");
      setContacts(res.data);
      setShowAddModal(false);
      setNewContact({ name: "", email: "", phone: "", position: "" });
      alert("Contact added successfully!");
    } catch {
      alert("Failed to add contact");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Contacts</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
        >
          + Add Contact
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : contacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact) => (
            <div key={contact.id} className="border rounded-lg p-4 hover:shadow transition-shadow">
              <div className="font-medium">{contact.name}</div>
              <div className="text-sm text-gray-600 mt-1">{contact.email}</div>
              {contact.phone && (
                <div className="text-sm text-gray-500 mt-1">{contact.phone}</div>
              )}
              {contact.position && (
                <div className="text-xs text-gray-400 mt-1">{contact.position}</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">No contacts yet</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            Add your first contact →
          </button>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-96 p-6">
            <h2 className="text-lg font-semibold mb-4">Add New Contact</h2>
            <form onSubmit={handleAddContact} className="space-y-3">
              <input
                type="text"
                placeholder="Name *"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
              <input
                type="text"
                placeholder="Position"
                value={newContact.position}
                onChange={(e) => setNewContact({ ...newContact, position: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1 border rounded-lg"
                >
                  Cancel
                </button>
                <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded-lg">
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Companies Tab Component
function CompaniesTab() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: "",
    type: "",
    country: "",
    website: "",
  });

  useEffect(() => {
    api
      .get("/companies")
      .then((res) => setCompanies(res.data))
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  }, []);

  const handleAddCompany = async (e) => {
    e.preventDefault();
    try {
      await api.post("/companies", newCompany);
      const res = await api.get("/companies");
      setCompanies(res.data);
      setShowAddModal(false);
      setNewCompany({ name: "", type: "", country: "", website: "" });
      alert("Company added successfully!");
    } catch {
      alert("Failed to add company");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Companies</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
        >
          + Add Company
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : companies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <div key={company.id} className="border rounded-lg p-4 hover:shadow transition-shadow">
              <div className="font-medium">{company.name}</div>
              {company.type && (
                <div className="text-sm text-gray-600 mt-1">Type: {company.type}</div>
              )}
              {company.country && (
                <div className="text-sm text-gray-500 mt-1">📍 {company.country}</div>
              )}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline mt-1 block"
                >
                  {company.website}
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">No companies yet</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            Add your first company →
          </button>
        </div>
      )}

      {/* Add Company Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-96 p-6">
            <h2 className="text-lg font-semibold mb-4">Add New Company</h2>
            <form onSubmit={handleAddCompany} className="space-y-3">
              <input
                type="text"
                placeholder="Company Name *"
                value={newCompany.name}
                onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
              <input
                type="text"
                placeholder="Type (Brand/Supplier)"
                value={newCompany.type}
                onChange={(e) => setNewCompany({ ...newCompany, type: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
              <input
                type="text"
                placeholder="Country"
                value={newCompany.country}
                onChange={(e) => setNewCompany({ ...newCompany, country: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
              <input
                type="url"
                placeholder="Website"
                value={newCompany.website}
                onChange={(e) => setNewCompany({ ...newCompany, website: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1 border rounded-lg"
                >
                  Cancel
                </button>
                <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded-lg">
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Amazon Tab Component
function AmazonTab() {
  const [amazonData, setAmazonData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profit, setProfit] = useState({ total_revenue: 0, total_expense: 0, profit: 0 });

  useEffect(() => {
    Promise.all([
      api.get("/amazon/data").catch(() => ({ data: [] })),
      api.get("/profit").catch(() => ({ data: { total_revenue: 0, total_expense: 0, profit: 0 } })),
    ]).then(([dataRes, profitRes]) => {
      setAmazonData(dataRes.data || []);
      setProfit(profitRes.data || { total_revenue: 0, total_expense: 0, profit: 0 });
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Amazon Data & Profit</h2>

      {/* Profit Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border rounded-lg p-4 text-center">
          <div className="text-sm text-gray-500 mb-1">Total Revenue</div>
          <div className="text-xl font-bold text-green-600">
            ${profit.total_revenue?.toLocaleString() || 0}
          </div>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <div className="text-sm text-gray-500 mb-1">Total Expenses</div>
          <div className="text-xl font-bold text-red-600">
            ${profit.total_expense?.toLocaleString() || 0}
          </div>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <div className="text-sm text-gray-500 mb-1">Net Profit</div>
          <div className="text-xl font-bold text-blue-600">
            ${profit.profit?.toLocaleString() || 0}
          </div>
        </div>
      </div>

      {/* Amazon Data */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : amazonData.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold">SKU</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Sales</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Refunds</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Stock</th>
              </tr>
            </thead>
            <tbody>
              {amazonData.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-2 text-sm">{item.sku}</td>
                  <td className="px-4 py-2 text-sm">${Number(item.sales || 0).toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm text-red-600">
                    ${Number(item.refunds || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-sm">{item.stock || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">No Amazon data yet</p>
          <button
            onClick={async () => {
              try {
                await api.post("/amazon/sync");
                const res = await api.get("/amazon/data");
                setAmazonData(res.data);
                alert("Amazon data synced!");
              } catch {
                alert("Failed to sync Amazon data");
              }
            }}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            Sync Amazon Data →
          </button>
        </div>
      )}
    </div>
  );
}
