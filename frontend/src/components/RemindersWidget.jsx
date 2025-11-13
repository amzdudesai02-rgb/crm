import React, { useEffect, useState } from "react";
import api from "../api";
import toast from "react-hot-toast";
import dayjs from "dayjs";

export default function RemindersWidget() {
  const [reminders, setReminders] = useState([]);

  const fetchReminders = async () => {
    const res = await api.get("/reminders");
    setReminders(res.data);
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const markDone = async (id) => {
    await api.put(`/reminders/${id}/complete`);
    toast.success("Reminder completed ✅");
    fetchReminders();
  };

  return (
    <div className="bg-white border rounded-2xl p-4">
      <h3 className="text-sm font-semibold mb-2">Upcoming Reminders</h3>
      <ul className="space-y-2 max-h-60 overflow-auto">
        {reminders
          .filter((r) => r.completed === 0)
          .map((r) => (
            <li
              key={r.id}
              className="flex justify-between items-center text-xs border rounded-lg p-2"
            >
              <div>
                <div className="font-medium">{r.title}</div>
                <div className="text-[11px] text-gray-400">
                  {dayjs(r.due_date).format("DD MMM, HH:mm")}
                </div>
              </div>
              <button
                onClick={() => markDone(r.id)}
                className="text-green-600 text-xs border px-2 py-0.5 rounded-lg hover:bg-green-50"
              >
                Done
              </button>
            </li>
          ))}
        {reminders.filter((r) => r.completed === 0).length === 0 && (
          <p className="text-xs text-gray-400">No pending reminders 🎉</p>
        )}
      </ul>
    </div>
  );
}
