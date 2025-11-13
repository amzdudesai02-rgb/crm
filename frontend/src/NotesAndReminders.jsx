import React, { useEffect, useState } from "react";
import api from "./api";
import toast from "react-hot-toast";
import dayjs from "dayjs";

export default function NotesAndReminders({ relatedType, relatedId }) {
  const [notes, setNotes] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [nextStep, setNextStep] = useState("");
  const [noteText, setNoteText] = useState("");
  const [newReminder, setNewReminder] = useState({ title: "", due_date: "" });

  useEffect(() => {
    Promise.all([
      api.get(`/notes/${relatedType}/${relatedId}`),
      api.get("/reminders"),
      api.get(`/smart/next_step/${relatedType}/${relatedId}`),
    ]).then(([n, r, s]) => {
      setNotes(n.data);
      setReminders(r.data);
      setNextStep(s.data.suggestion);
    });
  }, [relatedType, relatedId]);

  const addNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    await api.post("/notes", {
      content: noteText,
      related_type: relatedType,
      related_id: relatedId,
    });
    toast.success("Note added");
    setNoteText("");
    const n = await api.get(`/notes/${relatedType}/${relatedId}`);
    setNotes(n.data);
  };

  const addReminder = async (e) => {
    e.preventDefault();
    if (!newReminder.title || !newReminder.due_date) return;
    await api.post("/reminders", {
      title: newReminder.title,
      related_type: relatedType,
      related_id: relatedId,
      due_date: newReminder.due_date,
    });
    toast.success("Reminder created");
    setNewReminder({ title: "", due_date: "" });
    const r = await api.get("/reminders");
    setReminders(r.data);
  };

  return (
    <div className="bg-white rounded-2xl border p-4 mt-4">
      <h3 className="text-sm font-semibold mb-2">Notes & Reminders</h3>
      <p className="text-xs text-gray-500 mb-4">Next Step: {nextStep}</p>

      {/* Add note */}
      <form onSubmit={addNote} className="flex gap-2 mb-3">
        <input
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Write a note..."
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
        />
        <button className="bg-gray-900 text-white text-sm px-3 rounded-lg">
          Add
        </button>
      </form>

      <div className="space-y-2 mb-4 max-h-40 overflow-auto">
        {notes.map((n) => (
          <div key={n.id} className="text-sm border rounded-lg p-2">
            <p>{n.content}</p>
            <span className="text-[11px] text-gray-400">
              {dayjs(n.created_at).format("DD MMM, HH:mm")}
            </span>
          </div>
        ))}
      </div>

      {/* Reminder form */}
      <form onSubmit={addReminder} className="space-y-2 border-t pt-3">
        <input
          type="text"
          value={newReminder.title}
          onChange={(e) =>
            setNewReminder({ ...newReminder, title: e.target.value })
          }
          placeholder="Reminder title"
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={newReminder.due_date}
          onChange={(e) =>
            setNewReminder({ ...newReminder, due_date: e.target.value })
          }
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
        <button className="bg-blue-600 text-white text-sm px-3 py-1 rounded-lg">
          Add Reminder
        </button>
      </form>

      <div className="mt-3 space-y-1">
        {reminders
          .filter((r) => r.completed === 0)
          .slice(0, 5)
          .map((r) => (
            <div
              key={r.id}
              className="text-xs border rounded-lg px-3 py-2 flex justify-between items-center"
            >
              <span>
                {r.title} – {dayjs(r.due_date).format("DD MMM")}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
