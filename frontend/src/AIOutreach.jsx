import React, { useEffect, useState } from "react";
import api from "./api";
import toast from "react-hot-toast";
import AppHeader from "./components/AppHeader";

export default function AIOutreach() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [deals, setDeals] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedDealId, setSelectedDealId] = useState("");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [variables, setVariables] = useState({
    first_name: "",
    brand_name: "",
    category: "",
  });
  const [generated, setGenerated] = useState({ subject: "", body: "" });
  const [recipient, setRecipient] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [sending, setSending] = useState(false);

  // -------------------- Fetch Templates + User --------------------
  useEffect(() => {
    api.get("/templates").then((res) => setTemplates(res.data));

    // pull deals + contacts so you can pick targets instead of typing everything
    Promise.all([
      api.get("/pipeline/deals").catch(() => ({ data: [] })),
      api.get("/contacts").catch(() => ({ data: [] })),
    ]).then(([dealsRes, contactsRes]) => {
      setDeals(dealsRes.data || []);
      setContacts(contactsRes.data || []);
    });

    api
      .get("/users/me")
      .then((res) => setCurrentUser(res.data))
      .catch(() => toast.error("Failed to fetch user info"));
    
    // Check if Gmail was just connected or if there was an error
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("gmail_connected") === "true") {
      toast.success("Gmail connected successfully! ✅");
      // Remove query parameter from URL
      window.history.replaceState({}, "", window.location.pathname);
    } else if (urlParams.get("gmail_error")) {
      const error = urlParams.get("gmail_error");
      let errorMessage = "Failed to connect Gmail";
      
      switch (error) {
        case "no_code":
          errorMessage = "No authorization code received. Please try again.";
          break;
        case "token_exchange_failed":
          errorMessage = "Failed to exchange authorization code. Please try again.";
          break;
        case "userinfo_failed":
          errorMessage = "Failed to get user information from Google.";
          break;
        case "no_email":
          errorMessage = "No email found in Google account.";
          break;
        case "user_not_found":
          errorMessage = "User not found in CRM. Please login first.";
          break;
        case "save_failed":
          errorMessage = "Failed to save Gmail connection. Please try again.";
          break;
        case "unexpected_error":
          errorMessage = "An unexpected error occurred. Please check server logs.";
          break;
        default:
          errorMessage = `Gmail connection error: ${error}`;
      }
      
      toast.error(errorMessage);
      // Remove query parameter from URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // -------------------- Generate AI Email --------------------
  const handleGenerate = async () => {
    if (!selectedTemplate) {
      toast.error("Please select a template");
      return;
    }
    try {
      const res = await api.post("/ai/generate_email", {
        template_id: selectedTemplate,
        variables,
        tone: "professional",
        length: "medium",
      });
      setGenerated(res.data);
      toast.success("AI Email Generated ✅");
    } catch (err) {
      toast.error("Failed to generate email");
    }
  };

  // -------------------- Connect Gmail --------------------
  const handleConnectGmail = () => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
    window.location.href = `${apiBaseUrl}/auth/gmail`;
  };

  // -------------------- Send Email --------------------
  const handleSend = async () => {
    if (!recipient || !generated.body || !generated.subject) {
      toast.error("Please fill all fields before sending");
      return;
    }
    if (!currentUser?.email) {
      toast.error("User email not found");
      return;
    }

    try {
      setSending(true);
      toast.loading("Email Generating...", { id: "email-generating" });
      await api.post("/email/send_gmail", {
        to: recipient,
        subject: generated.subject,
        body: generated.body,
        user_email: currentUser.email, // logged-in user's Gmail ID
      });
      toast.dismiss("email-generating");
      toast.success(`Email sent via ${currentUser.email} 🎉`);
    } catch (err) {
      toast.dismiss("email-generating");
      if (err.response?.status === 401) {
        toast("Please connect your Gmail account first", {
          icon: "📧",
        });
        handleConnectGmail();
      } else {
        toast.error("Failed to send email");
      }
    }
    finally {
      setSending(false);
    }
  };

  // -------------------- UI --------------------
  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Hero / context */}
        <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              AI Outreach
            </p>
            <h1 className="mt-2 text-2xl md:text-3xl font-semibold">
              Turn pipeline into warm conversations.
            </h1>
            <p className="mt-2 text-sm text-white/70 max-w-xl">
              Pick a deal and contact, drop in a template, and let AI draft a
              first pass that still sounds like you.
            </p>
          </div>
          <div className="bg-white/10 border border-white/15 rounded-2xl px-4 py-3 text-xs space-y-1 min-w-[220px]">
            <p className="text-white/70 flex items-center justify-between gap-2">
              <span className="uppercase tracking-[0.25em] text-[10px]">
                Gmail
              </span>
              <button
                onClick={handleConnectGmail}
                className="px-3 py-1 rounded-full bg-white text-slate-900 text-[11px] font-medium hover:bg-slate-100 transition"
              >
                Connect Gmail
              </button>
            </p>
            <p className="text-white/80 truncate">
              {currentUser
                ? `Logged in as ${currentUser.email}`
                : "Connect your Google account to send from your inbox."}
            </p>
          </div>
        </section>

        {/* Main composer card */}
        <section className="bg-white shadow-sm rounded-3xl border border-gray-100 p-6 space-y-6">
          {/* Smart selection: deal + contact */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-800">
                Pick deal <span className="text-gray-400">(optional)</span>
              </label>
              <select
                value={selectedDealId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedDealId(id);
                  const deal = deals.find((d) => String(d.id) === id);
                  if (deal) {
                    setVariables((prev) => ({
                      ...prev,
                      brand_name: deal.company?.name || prev.brand_name,
                      category: deal.category || prev.category,
                    }));
                  }
                }}
                className="w-full border rounded-lg px-3 py-2 mt-1 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
              >
                <option value="">Select a deal</option>
                {deals.map((deal) => (
                  <option key={deal.id} value={deal.id}>
                    {deal.title} · ${Number(deal.value || 0).toLocaleString()}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Use deals from your pipeline to auto-fill brand and category.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-800">
                Pick contact <span className="text-gray-400">(fills To + name)</span>
              </label>
              <select
                value={selectedContactId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedContactId(id);
                  const contact = contacts.find((c) => String(c.id) === id);
                  if (contact) {
                    const firstName = (contact.name || "").split(" ")[0];
                    setRecipient(contact.email || "");
                    setVariables((prev) => ({
                      ...prev,
                      first_name: firstName || prev.first_name,
                    }));
                  }
                }}
                className="w-full border rounded-lg px-3 py-2 mt-1 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
              >
                <option value="">Select a contact</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.email}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Contacts come from your CRM; choosing one will set the To line
                and greeting.
              </p>
            </div>
          </div>

          {/* Template Selector */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-800">
              Choose template
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mt-1 bg-gray-50 text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
            >
              <option value="">Select a template</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              Templates live in Settings → Templates. Variables below will be merged into the copy.
            </p>
          </div>

          {/* Variables */}
          <div className="grid md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="First Name"
              value={variables.first_name}
              onChange={(e) =>
                setVariables({ ...variables, first_name: e.target.value })
              }
              className="border rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
            />
            <input
              type="text"
              placeholder="Brand Name"
              value={variables.brand_name}
              onChange={(e) =>
                setVariables({ ...variables, brand_name: e.target.value })
              }
              className="border rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
            />
            <input
              type="text"
              placeholder="Category"
              value={variables.category}
              onChange={(e) =>
                setVariables({ ...variables, category: e.target.value })
              }
              className="border rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Generate Button */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-500">
              You can tweak variables first, then generate and fully edit the draft before sending.
            </p>
            <button
              onClick={handleGenerate}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-blue-700 transition"
            >
              <span>Generate Email</span>
            </button>
          </div>

          {/* AI Generated Preview */}
          {generated.body && (
            <div className="border-t pt-5 space-y-3">
              <label className="text-sm font-medium text-gray-800">Preview & send</label>
              <input
                type="email"
                placeholder="recipient@example.com"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
              />

              <div className="space-y-2">
                <input
                  type="text"
                  value={generated.subject}
                  onChange={(e) =>
                    setGenerated({ ...generated, subject: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm font-medium bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                />
                <textarea
                  rows={8}
                  value={generated.body}
                  onChange={(e) =>
                    setGenerated({ ...generated, body: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex justify-end pt-3">
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className={`bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 ${
                    sending ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {sending && (
                    <span className="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                  )}
                  {sending ? "Email Generating..." : "Send Email"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
