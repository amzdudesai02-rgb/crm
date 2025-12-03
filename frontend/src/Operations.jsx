import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import AppHeader from "./components/AppHeader";
import api from "./api";

const statusColors = {
  draft: "bg-slate-100 text-slate-700",
  confirmed: "bg-blue-100 text-blue-700",
  in_transit: "bg-amber-100 text-amber-700",
  delivered: "bg-emerald-100 text-emerald-700",
  closed: "bg-gray-900 text-white",
};

export default function Operations() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [costForm, setCostForm] = useState({
    units_total: "",
    cogs_total: "",
    freight_cost: "",
    customs_cost: "",
    fba_fees: "",
    other_costs: "",
  });
  const [savingCosts, setSavingCosts] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ordersRes, shipmentsRes, invoicesRes] = await Promise.all([
          api.get("/orders").catch(() => ({ data: [] })),
          api.get("/shipments").catch(() => ({ data: [] })),
          api.get("/invoices").catch(() => ({ data: [] })),
        ]);
        setOrders(ordersRes.data || []);
        setShipments(shipmentsRes.data || []);
        setInvoices(invoicesRes.data || []);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-gray-500">Loading operations...</div>
      </div>
    );
  }

  const totalPOValue = orders.reduce((sum, po) => sum + Number(po.total_amount || 0), 0);
  const outstandingInvoices = invoices.filter((inv) => inv.status !== "paid");
  const shipmentsInFlight = shipments.filter((ship) => ship.status !== "delivered");

  const groupedOrders = ["draft", "confirmed", "in_transit", "delivered"].map((status) => ({
    status,
    items: orders.filter((po) => po.status === status || (!po.status && status === "draft")),
  }));

  const openOrderDetail = (order) => {
    setSelectedOrder(order);
    setCostForm({
      units_total: order.units_total ?? "",
      cogs_total: order.cogs_total ?? "",
      freight_cost: order.freight_cost ?? "",
      customs_cost: order.customs_cost ?? "",
      fba_fees: order.fba_fees ?? "",
      other_costs: order.other_costs ?? "",
    });
    setShowOrderModal(true);
  };

  const refreshOrders = async () => {
    try {
      const res = await api.get("/orders").catch(() => ({ data: [] }));
      setOrders(res.data || []);
    } catch {
      // ignore
    }
  };

  const handleSaveCosts = async () => {
    if (!selectedOrder) return;
    setSavingCosts(true);
    try {
      await api.put(`/orders/${selectedOrder.id}/costs`, {
        units_total: costForm.units_total === "" ? null : Number(costForm.units_total),
        cogs_total: costForm.cogs_total === "" ? null : Number(costForm.cogs_total),
        freight_cost: costForm.freight_cost === "" ? null : Number(costForm.freight_cost),
        customs_cost: costForm.customs_cost === "" ? null : Number(costForm.customs_cost),
        fba_fees: costForm.fba_fees === "" ? null : Number(costForm.fba_fees),
        other_costs: costForm.other_costs === "" ? null : Number(costForm.other_costs),
      });
      await refreshOrders();
      setShowOrderModal(false);
    } catch {
      // TODO: surface error once global toast system is wired here
    } finally {
      setSavingCosts(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">Operations Radar</p>
              <h1 className="mt-3 text-3xl font-semibold">Purchase orders, shipments, invoices.</h1>
              <p className="mt-2 text-base text-white/70">
                Keep landed cost, logistics, and cash in view without leaving Leverage CRM.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-white/10 rounded-2xl p-4 border border-white/10">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">PO value</p>
                <p className="text-3xl font-semibold">
                  ${totalPOValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Open invoices</p>
                <p className="text-3xl font-semibold">{outstandingInvoices.length}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard label="Active POs" value={orders.length} sub="Created across all brands" />
          <MetricCard label="Shipments in flight" value={shipmentsInFlight.length} sub="Tracking updates synced" />
          <MetricCard
            label="Outstanding invoices"
            value={outstandingInvoices.length}
            sub="Awaiting payment or documents"
          />
        </section>

        <section className="rounded-3xl bg-white p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Purchase orders board</h2>
              <p className="text-sm text-gray-500">Drag & drop coming soon — for now, review status lanes.</p>
            </div>
            <button className="px-4 py-2 rounded-full bg-gray-900 text-white text-sm">Create PO</button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {groupedOrders.map((group) => (
              <div key={group.status} className="rounded-2xl border border-gray-100 p-4 bg-slate-50/70">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold capitalize">{group.status.replace("_", " ")}</p>
                  <span className="text-xs text-gray-400">{group.items.length}</span>
                </div>
                <div className="space-y-3">
                  {group.items.length ? (
                    group.items.slice(0, 4).map((po) => (
                      <button
                        key={po.id}
                        type="button"
                        onClick={() => openOrderDetail(po)}
                        className="w-full text-left rounded-xl bg-white border border-gray-100 p-3 hover:border-slate-300 hover:shadow-sm transition"
                      >
                        <p className="font-medium text-gray-900">{po.reference || "PO"}</p>
                        <p className="text-sm text-gray-500">{po.company?.name || "Brand"}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          ETA {po.expected_arrival_date ? dayjs(po.expected_arrival_date).format("MMM D") : "TBD"}
                        </p>
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400">No records yet</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl bg-white p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Shipment timeline</h2>
              <p className="text-sm text-gray-500">{shipments.length} total</p>
            </div>
            <div className="space-y-4">
              {shipments.length ? (
                shipments.map((shipment) => (
                  <div key={shipment.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="flex-1 w-px bg-gray-200" />
                    </div>
                    <div className="flex-1 rounded-2xl border border-gray-100 p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900">
                          {shipment.carrier || "Carrier TBD"} · {shipment.tracking_number || "tracking soon"}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full uppercase tracking-widest ${
                            statusColors[shipment.status] || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {shipment.status || "label_created"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Departed {shipment.departed_at ? dayjs(shipment.departed_at).format("MMM D") : "TBD"} · ETA{" "}
                        {shipment.eta ? dayjs(shipment.eta).format("MMM D") : "pending"}
                      </p>
                      {shipment.notes && <p className="text-xs text-gray-400 mt-2">{shipment.notes}</p>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No shipments logged yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Invoice ledger</h2>
              <p className="text-sm text-gray-500">{invoices.length} invoices</p>
            </div>
            <div className="space-y-4">
              {invoices.length ? (
                invoices.slice(0, 6).map((invoice) => (
                  <div key={invoice.id} className="rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900">{invoice.invoice_number || "Invoice"}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full capitalize ${
                          invoice.status === "paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : invoice.status === "partial"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {invoice.status || "draft"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">${Number(invoice.amount || 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Due {invoice.due_date ? dayjs(invoice.due_date).format("MMM D, YYYY") : "TBD"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No invoices recorded.</p>
              )}
            </div>
          </div>
        </section>
      </div>
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Purchase Order</p>
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedOrder.reference || "Draft PO"} · {selectedOrder.company?.name || "Brand"}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Created {selectedOrder.order_date ? dayjs(selectedOrder.order_date).format("MMM D, YYYY") : "TBD"} ·{" "}
                  Status:{" "}
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 capitalize">
                    {selectedOrder.status || "draft"}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="text-xs text-gray-500 hover:text-gray-800"
              >
                Close
              </button>
            </div>

            <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-6">
              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-100 p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.25em] mb-2">
                    Cost Inputs
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-gray-600">Units</label>
                      <input
                        type="number"
                        min="1"
                        value={costForm.units_total}
                        onChange={(e) =>
                          setCostForm({ ...costForm, units_total: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600">COGS total ($)</label>
                      <input
                        type="number"
                        value={costForm.cogs_total}
                        onChange={(e) =>
                          setCostForm({ ...costForm, cogs_total: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600">Freight ($)</label>
                      <input
                        type="number"
                        value={costForm.freight_cost}
                        onChange={(e) =>
                          setCostForm({ ...costForm, freight_cost: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600">Customs ($)</label>
                      <input
                        type="number"
                        value={costForm.customs_cost}
                        onChange={(e) =>
                          setCostForm({ ...costForm, customs_cost: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600">FBA fees ($)</label>
                      <input
                        type="number"
                        value={costForm.fba_fees}
                        onChange={(e) =>
                          setCostForm({ ...costForm, fba_fees: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600">Other costs ($)</label>
                      <input
                        type="number"
                        value={costForm.other_costs}
                        onChange={(e) =>
                          setCostForm({ ...costForm, other_costs: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border px-2 py-1"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <button
                      type="button"
                      onClick={handleSaveCosts}
                      disabled={savingCosts}
                      className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm disabled:opacity-60"
                    >
                      {savingCosts ? "Saving..." : "Save cost changes"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-100 p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.25em] mb-2">
                    Landed Cost & Margin
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Total landed cost</span>
                      <span className="font-semibold text-gray-900">
                        $
                        {Number(selectedOrder.total_amount || 0).toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Landed cost / unit</span>
                      <span className="font-semibold text-gray-900">
                        $
                        {Number(
                          selectedOrder.landed_cost_per_unit || 0
                        ).toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Expected margin</span>
                      <span className="font-semibold text-emerald-700">
                        {Number(
                          selectedOrder.expected_margin_percent || 0
                        ).toLocaleString(undefined, {
                          maximumFractionDigits: 1,
                        })}
                        %
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.25em] mb-2">
                    Dates
                  </p>
                  <dl className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <dt>Order date</dt>
                      <dd>
                        {selectedOrder.order_date
                          ? dayjs(selectedOrder.order_date).format("MMM D, YYYY")
                          : "TBD"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Expected ship</dt>
                      <dd>
                        {selectedOrder.expected_ship_date
                          ? dayjs(selectedOrder.expected_ship_date).format("MMM D, YYYY")
                          : "TBD"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Expected arrival</dt>
                      <dd>
                        {selectedOrder.expected_arrival_date
                          ? dayjs(selectedOrder.expected_arrival_date).format("MMM D, YYYY")
                          : "TBD"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, sub }) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-gray-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

