"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ClipboardList } from "lucide-react";

// Mirrors lib/orderStatus.ts's forward-only pipeline — only the single
// "next step" button is offered here; the server re-validates regardless.
// POS `sales` rows use a different status enum entirely and never get these.
const NEXT_STATUS = {
  pending: { label: "Start Processing", value: "processing" },
  confirmed: { label: "Start Processing", value: "processing" },
  processing: { label: "Mark Shipped", value: "shipped" },
  shipped: { label: "Mark Delivered", value: "delivered" },
};
const CANCELABLE = new Set(["pending", "confirmed", "processing"]);

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [deciding, setDeciding] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const loadOrders = useCallback((showLoading = true) => {
    if (showLoading) setIsLoading(true);
    return fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((result) => setOrders(result.success ? result.data : []))
      .finally(() => {
        if (showLoading) setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    loadOrders();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        loadOrders(false);
      }
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [loadOrders]);

  async function submitDecision(decision) {
    setDeciding(true);
    const result = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: reviewOrder.id, decision }),
    }).then((r) => r.json());
    setDeciding(false);
    if (result.success) {
      setReviewOrder(null);
      loadOrders();
    }
  }

  async function advanceStatus(order, status) {
    setBusyId(order.id);
    const result = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: order.id, status }),
    }).then((r) => r.json());
    setBusyId(null);
    if (result.success) {
      loadOrders();
    } else {
      alert(result.message);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">အော်ဒါများ</h1>
        <p className="pt-3 text-slate-500">
          All transactions — in-store POS sales and storefront customer checkouts.
        </p>
      </div>

      <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-50 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
              <th className="px-8 py-5">Code</th>
              <th className="px-6 py-5">Source</th>
              <th className="px-6 py-5">Customer</th>
              <th className="px-6 py-5">Handled By</th>
              <th className="px-6 py-5">Total</th>
              <th className="px-6 py-5">Payment</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5">Date</th>
              <th className="px-6 py-5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading && (
              <tr><td colSpan={9} className="px-8 py-16 text-center font-bold text-slate-400">Loading...</td></tr>
            )}
            {!isLoading && orders.length === 0 && (
              <tr><td colSpan={9} className="px-8 py-16 text-center font-bold text-slate-400">No orders yet.</td></tr>
            )}
            {!isLoading &&
              orders.map((order) => (
                <tr key={`${order.source}-${order.id}`} className="hover:bg-slate-50/50">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                        <ClipboardList size={16} />
                      </div>
                      <p className="text-sm font-black text-slate-800">{order.code}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`rounded-lg px-3 py-1 text-[10px] font-black uppercase ${
                        order.source === "Storefront" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {order.source}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-600">{order.customer_name ?? "Walk-in"}</td>
                  <td className="px-6 py-5 text-sm text-slate-600">{order.handled_by ?? "—"}</td>
                  <td className="px-6 py-5 text-sm font-black text-slate-900">
                    {Number(order.total_ks).toLocaleString()} MMK
                  </td>
                  <td className="px-6 py-5 text-xs font-bold uppercase text-slate-500">{order.payment_method}</td>
                  <td className="px-6 py-5">
                    <span
                      className={`rounded-lg px-3 py-1 text-[10px] font-black uppercase ${
                        order.status === "completed" || order.status === "delivered" || order.status === "confirmed"
                          ? "bg-emerald-100 text-emerald-700"
                          : order.status === "cancelled"
                          ? "bg-red-100 text-red-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-xs font-semibold text-slate-400">
                    {new Date(order.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap items-center gap-2">
                      {order.payment_status === "pending_review" && (
                        <button
                          type="button"
                          onClick={() => setReviewOrder(order)}
                          className="rounded-lg bg-amber-100 px-3 py-1.5 text-[10px] font-black uppercase text-amber-700 hover:bg-amber-200"
                        >
                          Review Payment
                        </button>
                      )}
                      {order.source === "Storefront" && NEXT_STATUS[order.status] && (
                        <button
                          type="button"
                          disabled={busyId === order.id}
                          onClick={() => advanceStatus(order, NEXT_STATUS[order.status].value)}
                          className="rounded-lg bg-blue-100 px-3 py-1.5 text-[10px] font-black uppercase text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                        >
                          {NEXT_STATUS[order.status].label}
                        </button>
                      )}
                      {order.source === "Storefront" && CANCELABLE.has(order.status) && (
                        <button
                          type="button"
                          disabled={busyId === order.id}
                          onClick={() => {
                            if (confirm(`Cancel order ${order.code}?`)) advanceStatus(order, "cancelled");
                          }}
                          className="rounded-lg bg-red-50 px-3 py-1.5 text-[10px] font-black uppercase text-red-600 hover:bg-red-100 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                      {order.payment_status === "confirmed" && !NEXT_STATUS[order.status] && (
                        <span className="text-[10px] font-black uppercase text-emerald-600">Verified</span>
                      )}
                      {order.payment_status === "rejected" && (
                        <span className="text-[10px] font-black uppercase text-red-600">Rejected</span>
                      )}
                      {order.source === "POS" && (
                        <span className="text-[10px] font-bold uppercase text-slate-300">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {reviewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900">Review KBZ Pay Payment</h3>
            <p className="mt-1 text-sm text-slate-500">
              Order <span className="font-bold text-slate-700">{reviewOrder.code}</span> — {Number(reviewOrder.total_ks).toLocaleString()} MMK
            </p>

            <div className="mx-auto mt-5 flex max-w-sm justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
              {reviewOrder.payment_proof_url ? (
                <Image
                  src={reviewOrder.payment_proof_url}
                  alt="Payment screenshot"
                  width={600}
                  height={800}
                  className="h-auto max-h-[50vh] w-auto max-w-full object-contain"
                  unoptimized
                />
              ) : (
                <p className="p-10 text-center text-sm font-bold text-slate-400">No screenshot on file.</p>
              )}
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Confirm only after verifying the transaction in your own KBZ Pay/bank records. This is a manual check — no automated verification is performed.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setReviewOrder(null)}
                disabled={deciding}
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => submitDecision("rejected")}
                disabled={deciding}
                className="rounded-xl bg-red-50 px-5 py-2.5 text-sm font-black text-red-600 hover:bg-red-100 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => submitDecision("confirmed")}
                disabled={deciding}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
