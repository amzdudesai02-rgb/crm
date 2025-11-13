import React, { useEffect, useState } from "react";
import api from "./api";
import EmailWidget from "./EmailWidget";
import dayjs from "dayjs";
import RemindersWidget from "./components/RemindersWidget";
import DealTimeline from "./components/DealTimeline";


export default function DashboardHome() {
  const [stats, setStats] = useState({ deals: 0, contacts: 0, revenue: 0 });
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get("/pipeline/deals"),
      api.get("/contacts"),
      api.get("/reminders"),
    ]).then(([d, c, r]) => {
      const totalRevenue = d.data.reduce((a, b) => a + Number(b.value || 0), 0);
      setStats({
        deals: d.data.length,
        contacts: c.data.length,
        revenue: totalRevenue,
      });
      setReminders(r.data.slice(0, 5));
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border rounded-2xl p-4 text-center">
            <h3 className="text-gray-500 text-xs">Deals</h3>
            <div className="text-2xl font-semibold">{stats.deals}</div>
          </div>
          <div className="bg-white border rounded-2xl p-4 text-center">
            <h3 className="text-gray-500 text-xs">Contacts</h3>
            <div className="text-2xl font-semibold">{stats.contacts}</div>
          </div>
          <div className="bg-white border rounded-2xl p-4 text-center">
            <h3 className="text-gray-500 text-xs">Revenue</h3>
            <div className="text-2xl font-semibold">${stats.revenue}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EmailWidget />
          <RemindersWidget />
        </div>
      </div>
    </div>
  );
}
