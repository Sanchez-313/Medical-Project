"use client";

import { useEffect, useMemo, useState } from "react";
import { Truck, Search, Clock, LoaderCircle, UserRound, MapPin, Phone, Package } from "lucide-react";

// Mirrors lib/orderStatus.ts's forward-only pipeline (shared with
// /admin/orders' NEXT_STATUS) — only Storefront orders ship, and only once
// past 'pending' (still awaiting payment review/COD start) is there
// actually anything to hand off to a courier.
const DELIVERY_STATUSES = new Set(["confirmed", "processing", "shipped", "delivered"]);

const NEXT_STEP = {
  confirmed: { label: "Start Processing", value: "processing" },
  processing: { label: "Mark Shipped", value: "shipped" },
  shipped: { label: "Mark Delivered", value: "delivered" },
};

const STATUS_LABEL = {
  confirmed: "Awaiting Handoff",
  processing: "Preparing",
  shipped: "In Transit",
  delivered: "Delivered",
};

const STATUS_BADGE = {
  confirmed: "bg-slate-100 text-slate-700 border-slate-200",
  processing: "bg-amber-50 text-amber-700 border-amber-200",
  shipped: "bg-blue-50 text-blue-700 border-blue-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

/**
 * Delivery-focused view of storefront orders that have moved past payment
 * review and need physical handoff/tracking — a specialized read of the
 * same `orders` table /admin/orders already manages, not a separate
 * deliveries table. Order status IS delivery status here (pending ->
 * confirmed -> processing -> shipped -> delivered is one pipeline,
 * enforced server-side by lib/orderStatus.ts's canTransition — a second
 * parallel status field would just be a second source of truth to drift out
 * of sync with the real order). Ported from the original
 * Admin-Dashboard/src/components/DeliveryTracking/DeliveryTracking.jsx
 * layout (master list + detail panel + handoff buttons), Point-courier
 * specifics dropped since this schema has no courier/agency concept.
 */
export default function DeliveriesPage() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [busyId, setBusyId] = useState(null);

  function loadOrders() {
    setIsLoading(true);
    setError("");
    return fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((result) => {
        if (!result.success) {
          setError(result.message || "Could not load deliveries.");
          setOrders([]);
          return;
        }
        setOrders(result.data.filter((o) => o.source === "Storefront" && DELIVERY_STATUSES.has(o.status)));
      })
      .catch(() => setError("Could not load deliveries."))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        String(o.code).toLowerCase().includes(q) ||
        String(o.customer_name).toLowerCase().includes(q) ||
        String(o.shipping_city || "").toLowerCase().includes(q) ||
        String(o.shipping_address || "").toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);

  const active = filtered.find((o) => o.id === selectedId) || filtered[0] || null;

  async function advanceStatus(order, status) {
    setBusyId(order.id);
    const result = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: order.id, status }),
    }).then((r) => r.json());
    setBusyId(null);
    if (!result.success) {
      setError(result.message || "Could not update delivery status.");
      return;
    }
    // 'delivered' is still in DELIVERY_STATUSES, so a just-delivered order
    // stays visible here (as completed) instead of vanishing on refresh.
    loadOrders();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">Deliveries</h1>
        <p className="pt-3 text-slate-500">
          Storefront orders past payment review — track and advance handoff status through to delivery.
        </p>
      </div>

      <div className="flex h-[calc(100vh-260px)] min-h-[520px] overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
        <div className="flex w-[380px] shrink-0 flex-col border-r border-slate-100">
          <div className="border-b border-slate-50 bg-slate-50/40 p-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/10"
                placeholder="Search order, customer, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading && <p className="p-6 text-sm font-semibold text-slate-400">Loading deliveries...</p>}
            {!isLoading && error && <p className="p-6 text-sm font-semibold text-red-500">{error}</p>}
            {!isLoading && !error && filtered.length === 0 && (
              <p className="p-6 text-sm font-semibold text-slate-400">
                No deliveries yet — orders show up here once payment is confirmed.
              </p>
            )}
            {!isLoading &&
              !error &&
              filtered.map((order) => {
                const isActive = active?.id === order.id;
                return (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => setSelectedId(order.id)}
                    className={`w-full border-b border-slate-50 p-5 text-left transition-all ${
                      isActive ? "border-l-4 border-l-blue-600 bg-blue-50/60" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className={`rounded-lg px-2.5 py-1 text-xs font-black ${isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                        {order.code}
                      </span>
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${STATUS_BADGE[order.status]}`}>
                        {STATUS_LABEL[order.status]}
                      </span>
                    </div>
                    <p className="mt-3 truncate text-sm font-black text-slate-900">{order.customer_name}</p>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-400">{order.shipping_city || "—"}</p>
                  </button>
                );
              })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)] p-8">
          {active ? (
            <div className="mx-auto max-w-2xl">
              <div className="rounded-[2rem] border border-blue-100 bg-white/90 p-8 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black tracking-widest text-slate-400">Delivery detail</p>
                    <h2 className="mt-2 text-2xl font-black text-slate-900">{active.code}</h2>
                  </div>
                  <span className={`rounded-full border px-4 py-2 text-xs font-black ${STATUS_BADGE[active.status]}`}>
                    {STATUS_LABEL[active.status]}
                  </span>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <DetailCard icon={<UserRound size={18} />} label="Customer" value={active.customer_name} />
                  <DetailCard icon={<Phone size={18} />} label="Phone" value={active.shipping_phone || "—"} />
                  <DetailCard icon={<MapPin size={18} />} label="City" value={active.shipping_city || "—"} />
                  <DetailCard icon={<Package size={18} />} label="Total" value={`${Number(active.total_ks).toLocaleString()} MMK`} />
                </div>

                <div className="mt-5">
                  <DetailCard icon={<MapPin size={18} />} label="Delivery Address" value={active.shipping_address || "—"} />
                </div>
              </div>

              <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                <p className="text-xs font-black tracking-widest text-slate-400">Handoff control</p>
                <h3 className="mt-2 text-xl font-black text-slate-900">Advance Delivery Status</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Same fulfillment pipeline as Admin → Orders — moving it here updates the order everywhere.
                </p>

                <div className="mt-6">
                  {NEXT_STEP[active.status] ? (
                    <button
                      type="button"
                      disabled={busyId === active.id}
                      onClick={() => advanceStatus(active, NEXT_STEP[active.status].value)}
                      className="flex w-full items-center justify-center gap-2 rounded-[1.25rem] border border-blue-200 bg-blue-50 px-4 py-4 text-sm font-black text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {busyId === active.id ? <LoaderCircle size={16} className="animate-spin" /> : <Truck size={16} />}
                      {NEXT_STEP[active.status].label}
                    </button>
                  ) : (
                    <p className="flex items-center justify-center gap-2 rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-black text-emerald-700">
                      <Clock size={16} /> Delivered — no further action
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center font-semibold text-slate-400">
              Select a delivery to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailCard({ icon, label, value }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 px-5 py-4">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-[10px] font-black tracking-widest">{label}</span>
      </div>
      <p className="mt-2 text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}
