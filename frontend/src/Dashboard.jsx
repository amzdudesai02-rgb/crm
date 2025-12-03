// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import AppHeader from "./components/AppHeader";
import useAuthUser from "./hooks/useAuthUser";
import api from "./api";

const defaultStats = { deals: 0, contacts: 0, companies: 0, revenue: 0 };

export default function Dashboard() {
  const token = localStorage.getItem("token");
  const { loading, user } = useAuthUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(defaultStats);
  const [recentDeals, setRecentDeals] = useState([]);
  const [recentContacts, setRecentContacts] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [operations, setOperations] = useState({ orders: [], shipments: [], invoices: [] });
  const [aiQueue, setAiQueue] = useState([]);
  const [onboardingSteps, setOnboardingSteps] = useState([
    { id: "company", label: "Add your first brand/supplier company", done: false },
    { id: "deal", label: "Create a first deal in the pipeline", done: false },
    { id: "gmail", label: "Connect Gmail and send 1 email", done: false },
    { id: "po", label: "Draft a purchase order from a deal", done: false },
  ]);

  useEffect(() => {
    if (!token) return;

    // ⚡ First: fetch lightweight, user-facing data so the top of dashboard feels instant
    Promise.all([
      api.get("/pipeline/deals").catch(() => ({ data: [] })),
      api.get("/contacts").catch(() => ({ data: [] })),
      api.get("/companies").catch(() => ({ data: [] })),
      api.get("/reminders").catch(() => ({ data: [] })),
    ]).then(([dealsRes, contactsRes, companiesRes, remindersRes]) => {
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

      setRecentDeals(deals.slice(0, 5));
      setRecentContacts(contacts.slice(0, 5));
      setReminders((remindersRes.data || []).slice(0, 4));

      const outreachCandidates = deals
        .filter((deal) => !deal.last_email_sent_at)
        .slice(0, 3);
      setAiQueue(outreachCandidates);
    });

    // 🛰 Then: load heavier operations/intelligence data in the background
    Promise.all([
      api.get("/orders").catch(() => ({ data: [] })),
      api.get("/shipments").catch(() => ({ data: [] })),
      api.get("/invoices").catch(() => ({ data: [] })),
    ]).then(([ordersRes, shipmentsRes, invoicesRes]) => {
      const orders = ordersRes.data || [];
      const shipments = shipmentsRes.data || [];
      const invoices = invoicesRes.data || [];
      setOperations({ orders, shipments, invoices });
    });
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

  const formatCurrency = (value) =>
    `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  const latestShipment = operations.shipments?.[0];

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">
                Control Center · Phase 0–3 Ready
              </p>
              <h1 className="mt-3 text-3xl font-semibold">
                Hey {user?.name?.split(" ")[0] || "operator"}, keep the flywheel moving.
              </h1>
              <p className="mt-2 text-base text-white/70">
                Deals, outreach, operations, and profit intelligence — wired to the same data stack.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-white/10 rounded-2xl p-4 border border-white/10">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Open POs</p>
                <p className="text-3xl font-semibold">{operations.orders?.length || 0}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Shipments moving</p>
                <p className="text-3xl font-semibold">{operations.shipments?.length || 0}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total Deals", value: stats.deals, sub: "Across all stages" },
            { label: "Contacts", value: stats.contacts, sub: "Brand + supplier" },
            { label: "Companies", value: stats.companies, sub: "Active counterparts" },
            { label: "Pipeline Value", value: formatCurrency(stats.revenue), sub: "Expected gross" },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm hover:shadow-md transition"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">{card.label}</p>
              <p className="mt-3 text-3xl font-semibold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Next actions</h2>
                <button
                  onClick={() => navigate("/pipeline")}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Go to pipeline →
                </button>
              </div>
              <div className="mt-4 grid gap-3">
                {reminders.length > 0 ? (
                  reminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{reminder.title || "Reminder"}</p>
                        <p className="text-sm text-gray-500">
                          {reminder.description || "Follow up"} ·{" "}
                          {dayjs(reminder.due_date).format("MMM D")}
                        </p>
                      </div>
                      <button className="text-xs px-3 py-1 rounded-full bg-gray-900 text-white">
                        Mark done
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 text-center py-6">
                    No reminders yet — create one from any deal.
                  </div>
                )}
              </div>
            </div>

            {/* Onboarding checklist */}
            <div className="rounded-3xl bg-white p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Getting set up</h2>
                <span className="text-xs text-gray-400">
                  {onboardingSteps.filter((s) => s.done).length}/{onboardingSteps.length} completed
                </span>
              </div>
              <div className="space-y-3">
                {onboardingSteps.map((step) => (
                  <button
                    key={step.id}
                    type="button"
                    className={`w-full flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm ${
                      step.done
                        ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                        : "bg-white border-gray-100 hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      if (step.id === "company") setActiveTab("companies");
                      if (step.id === "deal") navigate("/pipeline");
                      if (step.id === "gmail") navigate("/ai-outreach");
                      if (step.id === "po") navigate("/pipeline");
                    }}
                  >
                    <span>{step.label}</span>
                    <span className="text-xs uppercase tracking-[0.25em] text-gray-400">
                      {step.done ? "Done" : "Start"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Recent deals</h2>
                <button
                  onClick={() => navigate("/pipeline")}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View all
                </button>
              </div>
              <div className="divide-y">
                {recentDeals.length ? (
                  recentDeals.map((deal) => (
                    <div key={deal.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{deal.title}</p>
                        <p className="text-sm text-gray-500">
                          {deal.stage || "New"} · {formatCurrency(deal.value)}
                        </p>
                      </div>
                      {deal.due_date && (
                        <p className="text-xs text-gray-400">
                          Due {dayjs(deal.due_date).format("MMM D")}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 py-6 text-center">No deals yet.</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Operations snapshot</h2>
                <button
                  onClick={() => navigate("/operations")}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Open Operations →
                </button>
              </div>
              <div className="space-y-4">
                {(operations.orders || []).slice(0, 3).map((order) => (
                  <div key={order.id} className="rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900">{order.reference || "Purchase Order"}</p>
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700 capitalize">
                        {order.status || "draft"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatCurrency(order.total_amount)} · {order.units_total || 0} units
                    </p>
                    {order.expected_arrival_date && (
                      <p className="text-xs text-gray-400 mt-2">
                        ETA {dayjs(order.expected_arrival_date).format("MMM D")}
                      </p>
                    )}
                  </div>
                ))}
                {!operations.orders?.length && (
                  <div className="text-sm text-gray-500 text-center py-6">
                    No purchase orders yet — convert a deal into a PO.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">AI outreach queue</h2>
                <button
                  onClick={() => navigate("/ai-outreach")}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Compose email →
                </button>
              </div>
              <div className="space-y-3">
                {aiQueue.length ? (
                  aiQueue.map((deal) => (
                    <div key={deal.id} className="rounded-2xl border border-gray-100 p-4">
                      <p className="font-medium text-gray-900">{deal.title}</p>
                      <p className="text-sm text-gray-500">
                        Stage: {deal.stage || "New"} · Owner: {deal.owner || "You"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-6">
                    All caught up. New deals will land here automatically.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 border border-gray-100 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Logistics highlight</h2>
              {latestShipment ? (
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-[0.3em]">
                    {latestShipment.status}
                  </p>
                  <p className="mt-2 text-xl font-semibold text-gray-900">
                    {latestShipment.carrier || "Carrier TBD"}
                  </p>
                  {latestShipment.eta && (
                    <p className="text-sm text-gray-500 mt-1">
                      ETA {dayjs(latestShipment.eta).format("MMM D, YYYY")}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No shipments yet.</p>
              )}
            </div>
          </div>
        </section>

        {/* Tabs Navigation */}
        <div className="bg-white border rounded-3xl p-1 flex gap-1 overflow-x-auto shadow-sm">
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
              className={`px-4 py-2 rounded-2xl text-sm font-medium whitespace-nowrap transition ${
                activeTab === tab.id ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white border rounded-3xl p-6 shadow-sm">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Overview</h2>
              {/* reuse earlier cards */}
              <div className="grid gap-6 md:grid-cols-2">
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
                              <div className="text-xs text-gray-500">{formatCurrency(deal.value)}</div>
                            </div>
                            {deal.due_date && (
                              <div className="text-xs text-gray-400">
                                Due: {dayjs(deal.due_date).format("MMM D")}
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
                        <div key={contact.id} className="border rounded-lg p-3 hover:bg-gray-50">
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
              </div>

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
