import React, { useEffect, useState } from "react";
import api from "../api";
import dayjs from "dayjs";

export default function DealTimeline({ dealId }) {
  const [notes, setNotes] = useState([]);
  const [interactions, setInteractions] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get(`/notes/deal/${dealId}`),
      api.get(`/interactions/deal/${dealId}`),
    ]).then(([n, i]) => {
      setNotes(n.data);
      setInteractions(i.data);
    });
  }, [dealId]);

  const items = [
    ...notes.map((n) => ({
      type: "note",
      text: n.content,
      date: n.created_at,
    })),
    ...interactions.map((x) => ({
      type: x.type,
      text: x.summary || x.subject,
      date: x.created_at,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="bg-white border rounded-2xl p-4 mt-4">
      <h3 className="text-sm font-semibold mb-2">Activity Timeline</h3>
      <div className="space-y-2 max-h-64 overflow-auto">
        {items.map((it, i) => (
          <div key={i} className="text-xs border-l-2 border-blue-500 pl-2">
            <div className="font-medium">
              [{it.type.toUpperCase()}] {it.text}
            </div>
            <div className="text-[11px] text-gray-400">
              {dayjs(it.date).format("DD MMM HH:mm")}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-gray-400">No activity yet</p>
        )}
      </div>
    </div>
  );
}
