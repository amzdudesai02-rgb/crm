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
import { useNavigate } from "react-router-dom";

export default function Pipeline() {
  const navigate = useNavigate();
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

  // Quick PO draft form state (Deal -> PO)
  const [poForm, setPoForm] = useState({
    units_total: "",
    cogs_total: "",
    freight_cost: "",
    customs_cost: "",
    fba_fees: "",
    other_costs: "",
  });
  const [creatingPO, setCreatingPO] = useState(false);

  // Simple “next action” intelligence
  const nextActions = useMemo(() => {
    const now = dayjs();
    const overdue = deals.filter(
      (d) => d.due_date && dayjs(d.due_date).isBefore(now, "day")
    );
    const noDueDate = deals.filter((d) => !d.due_date);
    const highValue = [...deals]
      .filter((d) => Number(d.value || 0) > 0)
      .sort((a, b) => Number(b.value || 0) - Number(a.value || 0))
      .slice(0, 5);

    return { overdue, noDueDate, highValue };
  }, [deals]);

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
    // pre-fill COGS with deal value by default
    setPoForm({
      units_total: "",
      cogs_total: deal.value || "",
      freight_cost: "",
      customs_cost: "",
      fba_fees: "",
      other_costs: "",
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

  const handleCreatePOFromDeal = async () => {
    if (!editDeal) return;

    const units = Number(poForm.units_total || 0);
    if (!units || units <= 0) {
      toast.error("Units must be greater than zero");
      return;
    }

    setCreatingPO(true);
    try {
      await api.post(`/orders/from-deal/${editDeal.id}`, {
        units_total: units,
        cogs_total: Number(poForm.cogs_total || 0),
        freight_cost: Number(poForm.freight_cost || 0),
        customs_cost: Number(poForm.customs_cost || 0),
        fba_fees: Number(poForm.fba_fees || 0),
        other_costs: Number(poForm.other_costs || 0),
      });
      toast.success("Draft PO created from deal ✅");
      setShowEditModal(false);
      navigate("/operations");
    } catch (err) {
      console.error(err);
      toast.error("Could not create PO from this deal");
    } finally {
      setCreatingPO(false);
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

        {/* Kanban Board + next actions rail */}
        {tab === "board" ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
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
                          {(columns[stage.id] || []).map((deal, idx) => {
                            const value = Number(deal.value || 0);
                            const isOverdue =
                              deal.due_date && dayjs(deal.due_date).isBefore(dayjs(), "day");
                            const isHighValue = value >= 20000; // simple heuristic

                            return (
                              <Draggable draggableId={deal.id} index={idx} key={deal.id}>
                                {(drag) => (
                                  <div
                                    ref={drag.innerRef}
                                    {...drag.draggableProps}
                                    {...drag.dragHandleProps}
                                    onClick={() => openEditModal(deal)}
                                    className="border rounded-xl p-3 bg-white hover:shadow cursor-pointer"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <div className="text-sm font-medium truncate max-w-[160px]">
                                          {deal.title}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          ${value.toLocaleString()}
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-1">
                                        {isOverdue && (
                                          <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">
                                            Overdue
                                          </span>
                                        )}
                                        {isHighValue && (
                                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                            High value
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {deal.due_date && (
                                      <div className="text-[11px] text-gray-400 mt-1">
                                        Due {dayjs(deal.due_date).format("DD MMM")}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                ))}
              </div>
            </DragDropContext>

            {/* Right rail: suggested next actions */}
            <aside className="bg-white rounded-2xl border p-4 space-y-4 self-start">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
                  Next actions
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Focus where the next dollar or reply is hiding.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <p className="font-semibold text-gray-700 mb-1">
                    Overdue follow-ups ({nextActions.overdue.length})
                  </p>
                  {nextActions.overdue.slice(0, 3).map((deal) => (
                    <button
                      key={deal.id}
                      type="button"
                      onClick={() => openEditModal(deal)}
                      className="w-full text-left rounded-lg border border-red-100 bg-red-50/40 px-3 py-2 mb-1 hover:bg-red-50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-gray-900 truncate max-w-[140px]">
                          {deal.title}
                        </span>
                        <span className="text-[10px] text-red-600">
                          Due {dayjs(deal.due_date).format("DD MMM")}
                        </span>
                      </div>
                    </button>
                  ))}
                  {!nextActions.overdue.length && (
                    <p className="text-[11px] text-gray-400">No overdue deals 🎯</p>
                  )}
                </div>

                <div className="border-t pt-3 mt-2">
                  <p className="font-semibold text-gray-700 mb-1">
                    High-value opportunities ({nextActions.highValue.length})
                  </p>
                  {nextActions.highValue.slice(0, 3).map((deal) => (
                    <button
                      key={deal.id}
                      type="button"
                      onClick={() => openEditModal(deal)}
                      className="w-full text-left rounded-lg border border-amber-100 bg-amber-50/40 px-3 py-2 mb-1 hover:bg-amber-50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-gray-900 truncate max-w-[140px]">
                          {deal.title}
                        </span>
                        <span className="text-[10px] text-amber-700">
                          ${Number(deal.value || 0).toLocaleString()}
                        </span>
                      </div>
                    </button>
                  ))}
                  {!nextActions.highValue.length && (
                    <p className="text-[11px] text-gray-400">No large deals yet.</p>
                  )}
                </div>

                <div className="border-t pt-3 mt-2">
                  <p className="font-semibold text-gray-700 mb-1">
                    Deals missing due date ({nextActions.noDueDate.length})
                  </p>
                  {nextActions.noDueDate.slice(0, 3).map((deal) => (
                    <button
                      key={deal.id}
                      type="button"
                      onClick={() => openEditModal(deal)}
                      className="w-full text-left rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 mb-1 hover:bg-slate-100"
                    >
                      <span className="font-medium text-gray-900 truncate max-w-[180px]">
                        {deal.title}
                      </span>
                    </button>
                  ))}
                  {!nextActions.noDueDate.length && (
                    <p className="text-[11px] text-gray-400">All deals have dates set.</p>
                  )}
                </div>
              </div>
            </aside>
          </div>
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

            {/* --- Deal → Purchase Order draft --- */}
            <div className="border-t mt-5 pt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold">Draft Purchase Order</h4>
                <span className="text-[11px] text-gray-400">
                  Turn this opportunity into an actual PO
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Enter the units and cost buckets you expect for this deal. We’ll create a draft PO and
                compute landed cost per unit and margin in Operations.
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-gray-600">Units</label>
                  <input
                    type="number"
                    min="1"
                    value={poForm.units_total}
                    onChange={(e) =>
                      setPoForm({ ...poForm, units_total: e.target.value })
                    }
                    className="w-full border rounded-lg px-2 py-1 mt-1"
                    placeholder="e.g. 1200"
                  />
                </div>
                <div>
                  <label className="block text-gray-600">COGS total ($)</label>
                  <input
                    type="number"
                    value={poForm.cogs_total}
                    onChange={(e) =>
                      setPoForm({ ...poForm, cogs_total: e.target.value })
                    }
                    className="w-full border rounded-lg px-2 py-1 mt-1"
                    placeholder={String(editDeal.value || "")}
                  />
                </div>
                <div>
                  <label className="block text-gray-600">Freight ($)</label>
                  <input
                    type="number"
                    value={poForm.freight_cost}
                    onChange={(e) =>
                      setPoForm({ ...poForm, freight_cost: e.target.value })
                    }
                    className="w-full border rounded-lg px-2 py-1 mt-1"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-gray-600">Customs ($)</label>
                  <input
                    type="number"
                    value={poForm.customs_cost}
                    onChange={(e) =>
                      setPoForm({ ...poForm, customs_cost: e.target.value })
                    }
                    className="w-full border rounded-lg px-2 py-1 mt-1"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-gray-600">FBA fees ($)</label>
                  <input
                    type="number"
                    value={poForm.fba_fees}
                    onChange={(e) =>
                      setPoForm({ ...poForm, fba_fees: e.target.value })
                    }
                    className="w-full border rounded-lg px-2 py-1 mt-1"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-gray-600">Other costs ($)</label>
                  <input
                    type="number"
                    value={poForm.other_costs}
                    onChange={(e) =>
                      setPoForm({ ...poForm, other_costs: e.target.value })
                    }
                    className="w-full border rounded-lg px-2 py-1 mt-1"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={handleCreatePOFromDeal}
                  disabled={creatingPO}
                  className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-sm disabled:opacity-60"
                >
                  {creatingPO ? "Creating PO..." : "Draft PO from this deal"}
                </button>
              </div>
            </div>

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
