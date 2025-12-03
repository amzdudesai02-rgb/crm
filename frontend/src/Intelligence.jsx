import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import AppHeader from "./components/AppHeader";
import api from "./api";

export default function Intelligence() {
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState([]);
  const [orders, setOrders] = useState([]);
  const [profit, setProfit] = useState({ total_revenue: 0, total_expense: 0, profit: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const [dealsRes, ordersRes, profitRes] = await Promise.all([
          api.get("/pipeline/deals").catch(() => ({ data: [] })),
          api.get("/orders").catch(() => ({ data: [] })),
          api.get("/profit").catch(() => ({ data: { total_revenue: 0, total_expense: 0, profit: 0 } })),
        ]);
        setDeals(dealsRes.data || []);
        setOrders(ordersRes.data || []);
        setProfit(profitRes.data || { total_revenue: 0, total_expense: 0, profit: 0 });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-gray-500">Loading intelligence...</div>
      </div>
    );
  }

  const pipelineByStage = deals.reduce((acc, deal) => {
    const stage = deal.stage || "New";
    acc[stage] = acc[stage] ? acc[stage] + Number(deal.value || 0) : Number(deal.value || 0);
    return acc;
  }, {});

  const topDeals = [...deals]
    .sort((a, b) => Number(b.value || 0) - Number(a.value || 0))
    .slice(0, 4);

  const marginByOrder = orders.map((order) => ({
    id: order.id,
    reference: order.reference || "PO",
    margin: Number(order.expected_margin_percent || 0),
    total: Number(order.total_amount || 0),
  }));

  const avgMargin =
    marginByOrder.reduce((sum, item) => sum + item.margin, 0) / (marginByOrder.length || 1);

  // simple derived value; no need for a hook here (avoids hook-order issues)
  const nearDueDeals = deals
    .filter((deal) => deal.due_date && dayjs(deal.due_date).diff(dayjs(), "day") <= 7)
    .slice(0, 3);

  const openPOs = orders.filter((o) => o.status !== "closed");
  const capitalTied =
    openPOs.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) ?? 0;
  const shipmentsInTransit = orders.filter(
    (o) => o.status === "in_transit" || o.status === "confirmed"
  ).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        <section className="rounded-3xl bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">Intelligence Hub</p>
              <h1 className="mt-3 text-3xl font-semibold">See what to act on, not just the data.</h1>
              <p className="mt-2 text-base text-white/70">
                Pulls from deals, purchase orders, and finance to surface the strongest moves.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 bg-white/10 rounded-2xl p-4 border border-white/10 text-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Revenue</p>
                <p className="text-2xl font-semibold">${profit.total_revenue?.toLocaleString() || 0}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Expense</p>
                <p className="text-2xl font-semibold">${profit.total_expense?.toLocaleString() || 0}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Profit</p>
                <p className="text-2xl font-semibold">${profit.profit?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <InsightCard title="Deals in play" value={deals.length} detail="Active across all stages" />
          <InsightCard title="Avg. PO margin" value={`${avgMargin.toFixed(1)}%`} detail="Expected landed cost" />
          <InsightCard
            title="Pipeline coverage"
            value={`$${Object.values(pipelineByStage)
              .reduce((sum, v) => sum + v, 0)
              .toLocaleString()}`}
            detail="Total expected revenue"
          />
          <InsightCard
            title="Capital in open POs"
            value={`$${capitalTied.toLocaleString()}`}
            detail="Cash committed but not realized"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl bg-white p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Pipeline by stage</h2>
              <p className="text-sm text-gray-500">Value distribution</p>
            </div>
            <div className="space-y-3">
              {Object.entries(pipelineByStage).map(([stage, value]) => (
                <div key={stage}>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{stage}</span>
                    <span>${value.toLocaleString()}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 mt-1">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (value /
                            Math.max(
                              1,
                              Object.values(pipelineByStage).reduce((sum, v) => sum + v, 0)
                            )) *
                            100
                        ).toFixed(2)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Deals nearing deadline</h2>
              <p className="text-sm text-gray-500">Next 7 days</p>
            </div>
            {nearDueDeals.length ? (
              <div className="space-y-4">
                {nearDueDeals.map((deal) => (
                  <div key={deal.id} className="rounded-2xl border border-gray-100 p-4">
                    <p className="font-semibold text-gray-900">{deal.title}</p>
                    <p className="text-sm text-gray-500">
                      {deal.stage || "New"} · ${Number(deal.value || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Due {dayjs(deal.due_date).format("MMM D, YYYY")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nothing critical this week.</p>
            )}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 border border-gray-100 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold">Top opportunities</h2>
              <p className="text-sm text-gray-500">Highest-value deals waiting on action</p>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-800">Jump to pipeline →</button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {topDeals.length ? (
              topDeals.map((deal) => (
                <div key={deal.id} className="rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900">{deal.title}</p>
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                      {deal.stage || "New"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    ${Number(deal.value || 0).toLocaleString()} · Owner {deal.owner || "Unassigned"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Updated {dayjs(deal.updated_at || deal.created_at || new Date()).format("MMM D, YYYY")}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No deals yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function InsightCard({ title, value, detail }) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-gray-500">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{detail}</p>
    </div>
  );
}

