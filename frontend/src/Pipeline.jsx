import React, { useEffect, useMemo, useState } from "react";
import api from "./api";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import dayjs from "dayjs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import AppHeader from "./components/AppHeader";
import toast from "react-hot-toast";
import NotesAndReminders from "./NotesAndReminders";

export default function Pipeline() {
  const [tab, setTab] = useState("board");
  const [stages, setStages] = useState([]);
  const [deals, setDeals] = useState([]);
  const [timeline, setTimeline] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newDeal, setNewDeal] = useState({
    title: "",
    value: "",
    stage_id: "",
    due_date: "",
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editDeal, setEditDeal] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get("/pipeline/stages"),
      api.get("/pipeline/deals"),
      api.get("/pipeline/timeline"),
    ]).then(([s, d, t]) => {
      setStages(s.data);
      setDeals(d.data);
      setTimeline(t.data);
    });
  }, []);

  const columns = useMemo(() => {
    const map = {};
    stages.forEach((s) => (map[s.id] = []));
    deals.forEach((d) => {
      if (map[d.stage_id]) map[d.stage_id].push(d);
    });
    Object.values(map).forEach((list) =>
      list.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    );
    return map;
  }, [stages, deals]);

  const onDragEnd = async (result) => {
    const { destination, draggableId } = result;
    if (!destination) return;

    const toStage = destination.droppableId;
    const toIndex = destination.index;

    setDeals((prev) => {
      const moving = prev.find((d) => d.id === draggableId);
      if (!moving) return prev;
      const others = prev.filter((d) => d.id !== draggableId);
      return [
        ...others,
        { ...moving, stage_id: toStage, position: toIndex + 1 },
      ];
    });

    await api.put(`/pipeline/deals/${draggableId}/move`, {
      to_stage_id: toStage,
      to_position: toIndex + 1,
    });
  };

  const handleCreateDeal = async (e) => {
    e.preventDefault();
    if (!newDeal.title || !newDeal.stage_id) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await api.post("/pipeline/deals", {
        title: newDeal.title,
        value: Number(newDeal.value) || 0,
        stage_id: newDeal.stage_id,
        due_date: newDeal.due_date || null,
      });
      toast.success("Deal created ✅");
      setShowAddModal(false);
      setNewDeal({ title: "", value: "", stage_id: "", due_date: "" });
      const [d, t] = await Promise.all([
        api.get("/pipeline/deals"),
        api.get("/pipeline/timeline"),
      ]);
      setDeals(d.data);
      setTimeline(t.data);
    } catch {
      toast.error("Error creating deal");
    }
  };

  const openEditModal = (deal) => {
    setEditDeal({
      id: deal.id,
      title: deal.title,
      value: deal.value,
      due_date: deal.due_date ? dayjs(deal.due_date).format("YYYY-MM-DD") : "",
    });
    setShowEditModal(true);
  };

  const handleUpdateDeal = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/pipeline/deals/${editDeal.id}`, {
        title: editDeal.title,
        value: Number(editDeal.value),
        due_date: editDeal.due_date || null,
      });
      toast.success("Deal updated successfully ✅");
      setShowEditModal(false);
      const [d, t] = await Promise.all([
        api.get("/pipeline/deals"),
        api.get("/pipeline/timeline"),
      ]);
      setDeals(d.data);
      setTimeline(t.data);
    } catch {
      toast.error("Update failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setTab("board")}
              className={`px-3 py-1 rounded-lg ${
                tab === "board" ? "bg-gray-900 text-white" : "border"
              }`}
            >
              Kanban Board
            </button>
            <button
              onClick={() => setTab("timeline")}
              className={`px-3 py-1 rounded-lg ${
                tab === "timeline" ? "bg-gray-900 text-white" : "border"
              }`}
            >
              Timeline
            </button>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1 bg-blue-600 text-white rounded-lg"
          >
            + New Deal
          </button>
        </div>

        {/* Kanban Board */}
        {tab === "board" ? (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {stages.map((stage) => (
                <div key={stage.id} className="bg-white rounded-2xl border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">{stage.name}</h3>
                    <span className="text-xs text-gray-400">
                      {columns[stage.id]?.length || 0}
                    </span>
                  </div>
                  <Droppable droppableId={stage.id}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="min-h-[80px] space-y-2"
                      >
                        {(columns[stage.id] || []).map((deal, idx) => (
                          <Draggable draggableId={deal.id} index={idx} key={deal.id}>
                            {(drag) => (
                              <div
                                ref={drag.innerRef}
                                {...drag.draggableProps}
                                {...drag.dragHandleProps}
                                onClick={() => openEditModal(deal)}
                                className="border rounded-xl p-3 bg-white hover:shadow cursor-pointer"
                              >
                                <div className="text-sm font-medium">{deal.title}</div>
                                <div className="text-xs text-gray-500">
                                  ${Number(deal.value || 0).toLocaleString()}
                                </div>
                                {deal.due_date && (
                                  <div className="text-[11px] text-gray-400 mt-1">
                                    Due {dayjs(deal.due_date).format("DD MMM")}
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        ) : (
          // Timeline chart view
          <div className="bg-white border rounded-2xl p-4">
            <div className="text-sm font-semibold mb-3">Deals by Due Date</div>
            <div className="w-full h-72">
              <ResponsiveContainer>
                <BarChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* --- Add Deal Modal --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-96 p-6">
            <h2 className="text-lg font-semibold mb-4">Create New Deal</h2>
            <form onSubmit={handleCreateDeal} className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Title</label>
                <input
                  type="text"
                  value={newDeal.title}
                  onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Value ($)</label>
                <input
                  type="number"
                  value={newDeal.value}
                  onChange={(e) => setNewDeal({ ...newDeal, value: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Stage</label>
                <select
                  value={newDeal.stage_id}
                  onChange={(e) => setNewDeal({ ...newDeal, stage_id: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  required
                >
                  <option value="">Select Stage</option>
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600">Due Date</label>
                <input
                  type="date"
                  value={newDeal.due_date}
                  onChange={(e) => setNewDeal({ ...newDeal, due_date: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Edit Deal Modal --- */}
      {showEditModal && editDeal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-[600px] p-6 overflow-y-auto max-h-[90vh]">
            <h2 className="text-lg font-semibold mb-4">Edit Deal</h2>
            <form onSubmit={handleUpdateDeal} className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Title</label>
                <input
                  type="text"
                  value={editDeal.title}
                  onChange={(e) => setEditDeal({ ...editDeal, title: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Value ($)</label>
                <input
                  type="number"
                  value={editDeal.value}
                  onChange={(e) => setEditDeal({ ...editDeal, value: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Due Date</label>
                <input
                  type="date"
                  value={editDeal.due_date}
                  onChange={(e) =>
                    setEditDeal({ ...editDeal, due_date: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3 py-1 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg"
                >
                  Save
                </button>
              </div>
            </form>

            {/* --- Notes & Reminders --- */}
            <div className="border-t mt-5 pt-4">
              <NotesAndReminders relatedType="deal" relatedId={editDeal.id} />
            </div>

            {/* --- Tags --- */}
            <div className="border-t pt-3 mt-5">
              <h4 className="text-sm font-semibold mb-2">Tags</h4>
              <input
                type="text"
                placeholder="Add tag..."
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const tagName = e.target.value.trim();
                    if (!tagName) return;
                    try {
                      const tag = await api.post("/tags", { name: tagName });
                      await api.post(
                        `/tags/link?tag_id=${tag.data.id}&related_type=deal&related_id=${editDeal.id}`
                      );
                      e.target.value = "";
                      toast.success("Tag added ✅");
                    } catch {
                      toast.error("Failed to add tag");
                    }
                  }
                }}
                className="w-full border rounded-lg px-3 py-1 text-sm"
              />
            </div>

            {/* --- Activity Timeline --- */}
            <div className="border-t mt-5 pt-4">
              <h4 className="text-sm font-semibold mb-2">Activity Timeline</h4>
              <div className="max-h-[200px] overflow-auto text-xs text-gray-700 space-y-2">
                <p className="text-gray-400 text-[12px]">
                  (This will show calls, emails & note history soon)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
