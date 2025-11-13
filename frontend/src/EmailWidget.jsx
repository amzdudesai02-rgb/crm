import React, { useEffect, useState } from "react";
import api from "./api";

export default function EmailWidget() {
  const [emails, setEmails] = useState([]);
  useEffect(() => {
    api.get("/emails/recent").then((res) => setEmails(res.data.emails));
  }, []);

  return (
    <div className="bg-white border rounded-2xl p-4">
      <h3 className="text-sm font-semibold mb-2">Recent Emails</h3>
      <div className="space-y-2">
        {emails.map((e, i) => (
          <div key={i} className="text-xs border rounded-lg p-2">
            <div className="font-medium">{e.subject}</div>
            <div className="text-gray-500">{e.from}</div>
            <div className="text-[11px] text-gray-400">{e.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
