import React, { useEffect, useState } from "react";
import api from "./api";
import toast from "react-hot-toast";
import AppHeader from "./components/AppHeader";

export default function AIOutreach() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [variables, setVariables] = useState({
    first_name: "",
    brand_name: "",
    category: "",
  });
  const [generated, setGenerated] = useState({ subject: "", body: "" });
  const [recipient, setRecipient] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // -------------------- Fetch Templates + User --------------------
  useEffect(() => {
    api.get("/templates").then((res) => setTemplates(res.data));
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
      await api.post("/email/send_gmail", {
        to: recipient,
        subject: generated.subject,
        body: generated.body,
        user_email: currentUser.email, // logged-in user's Gmail ID
      });
      toast.success(`Email sent via ${currentUser.email} 🎉`);
    } catch (err) {
      if (err.response?.status === 401) {
        toast("Please connect your Gmail account first", {
          icon: "📧",
        });
        handleConnectGmail();
      } else {
        toast.error("Failed to send email");
      }
    }
  };

  // -------------------- UI --------------------
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">
        <h1 className="text-xl font-semibold">AI Outreach & Email Sender</h1>

        {/* Gmail Connect Button */}
        <div className="flex justify-between items-center">
          {currentUser && (
            <p className="text-sm text-gray-500">
              Logged in as: <b>{currentUser.email}</b>
            </p>
          )}
          <button
            onClick={handleConnectGmail}
            className="border px-3 py-1 rounded-lg text-sm bg-white hover:bg-gray-100"
          >
            Connect Gmail
          </button>
        </div>

        {/* Template Selector */}
        <div>
          <label className="text-sm font-medium">Choose Template</label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1"
          >
            <option value="">Select a template</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
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
            className="border rounded-lg px-3 py-2"
          />
          <input
            type="text"
            placeholder="Brand Name"
            value={variables.brand_name}
            onChange={(e) =>
              setVariables({ ...variables, brand_name: e.target.value })
            }
            className="border rounded-lg px-3 py-2"
          />
          <input
            type="text"
            placeholder="Category"
            value={variables.category}
            onChange={(e) =>
              setVariables({ ...variables, category: e.target.value })
            }
            className="border rounded-lg px-3 py-2"
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Generate Email
        </button>

        {/* AI Generated Preview */}
        {generated.body && (
          <div className="border-t pt-4">
            <label className="text-sm font-medium">To:</label>
            <input
              type="email"
              placeholder="recipient@example.com"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-3"
            />

            <div className="space-y-2">
              <input
                type="text"
                value={generated.subject}
                onChange={(e) =>
                  setGenerated({ ...generated, subject: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2 font-medium"
              />
              <textarea
                rows={8}
                value={generated.body}
                onChange={(e) =>
                  setGenerated({ ...generated, body: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={handleSend}
                className="bg-green-600 text-white px-4 py-2 rounded-lg"
              >
                Send Email
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
