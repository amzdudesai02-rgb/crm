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
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    if (!token) return;

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
  }, [token]);

  if (!token) {
    window.location.href = "/login";
    return null;
  }

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
                      <div key={po.id} className="rounded-xl bg-white border border-gray-100 p-3">
                        <p className="font-medium text-gray-900">{po.reference || "PO"}</p>
                        <p className="text-sm text-gray-500">{po.company?.name || "Brand"}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          ETA {po.expected_arrival_date ? dayjs(po.expected_arrival_date).format("MMM D") : "TBD"}
                        </p>
                      </div>
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

