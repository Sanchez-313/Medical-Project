"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ClipboardList } from "lucide-react";
import Pagination from "@/components/Pagination";
import Toast from "@/components/Toast";

const ITEMS_PER_PAGE = 10;

const STATUS_BADGE = {
  pending: "bg-slate-100 text-slate-600",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-amber-100 text-amber-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

// Mirrors lib/orderStatus.ts's forward-only pipeline — only the single
// "next step" button is offered here; the server re-validates regardless.
const NEXT_STATUS = {
  pending: { label: "Start Processing", value: "processing" },
  confirmed: { label: "Start Processing", value: "processing" },
  processing: { label: "Mark Shipped", value: "shipped" },
  shipped: { label: "Mark Delivered", value: "delivered" },
};
const CANCELABLE = new Set(["pending", "confirmed", "processing"]);

export default function StaffOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState(null);

  // `silent` skips isLoading and the pagination reset — used for the
  // background poll below so it doesn't flash "Loading..." or bounce staff
  // back to page 1 every few seconds while they're browsing later pages.
  function loadOrders({ silent = false } = {}) {
    if (!silent) setIsLoading(true);
    return fetch("/api/staff/orders")
      .then((r) => r.json())
      .then((result) => {
        setOrders(result.success ? result.data : []);
        if (!silent) setCurrentPage(1);
      })
      .finally(() => {
        if (!silent) setIsLoading(false);
      });
  }

  useEffect(() => {
    loadOrders();
    // New storefront orders and other staff/admins' review decisions don't
    // push any event here, so poll for them instead of requiring a manual
    // refresh to see a just-placed order or an updated payment status.
    const interval = setInterval(() => loadOrders({ silent: true }), 5000);
    return () => clearInterval(interval);
  }, []);

  async function submitDecision(decision) {
    setBusyId(reviewOrder.id);
    const orderCode = reviewOrder.order_code;
    const result = await fetch("/api/staff/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: reviewOrder.id, decision }),
    }).then((r) => r.json());
    setBusyId(null);
    if (result.success) {
      setReviewOrder(null);
      loadOrders({ silent: true });
      setToast({
        type: decision === "confirmed" ? "success" : "error",
        message:
          decision === "confirmed"
            ? `Payment confirmed for ${orderCode}.`
            : `Payment rejected for ${orderCode}.`,
      });
    } else {
      setToast({ type: "error", message: result.message ?? "Could not save the decision." });
    }
  }

  async function advanceStatus(order, status) {
    setBusyId(order.id);
    const result = await fetch("/api/staff/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: order.id, status }),
    }).then((r) => r.json());
    setBusyId(null);
    if (result.success) {
      loadOrders({ silent: true });
    } else {
      alert(result.message);
    }
  }

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const currentItems = orders.slice(indexOfLastItem - ITEMS_PER_PAGE, indexOfLastItem);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Customer Orders</h1>
        <p className="pt-3 text-slate-500">Review KBZ Pay payments and move orders through fulfillment.</p>
      </div>

      <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-50 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
              <th className="px-8 py-5">Code</th>
              <th className="px-6 py-5">Customer</th>
              <th className="px-6 py-5">Total</th>
              <th className="px-6 py-5">Payment</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5">Date</th>
              <th className="px-6 py-5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading && (
              <tr><td colSpan={7} className="px-8 py-16 text-center font-bold text-slate-400">Loading...</td></tr>
            )}
            {!isLoading && orders.length === 0 && (
              <tr><td colSpan={7} className="px-8 py-16 text-center font-bold text-slate-400">No orders yet.</td></tr>
            )}
            {!isLoading &&
              currentItems.map((order) => {
                const next = NEXT_STATUS[order.status];
                return (
                  <tr key={order.id} className="hover:bg-slate-50/50">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                          <ClipboardList size={16} />
                        </div>
                        <p className="text-sm font-black text-slate-800">{order.order_code}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600">
                      {order.shipping_name}
                      {order.telegram_username && (
                        <span className="ml-1.5 text-xs font-semibold text-sky-500">@{order.telegram_username}</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-sm font-black text-slate-900">
                      {Number(order.total_ks).toLocaleString()} MMK
                    </td>
                    <td className="px-6 py-5 text-xs font-bold uppercase text-slate-500">{order.payment_method}</td>
                    <td className="px-6 py-5">
                      <span className={`rounded-lg px-3 py-1 text-[10px] font-black uppercase ${STATUS_BADGE[order.status] ?? STATUS_BADGE.pending}`}>
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
                        {next && (
                          <button
                            type="button"
                            disabled={busyId === order.id}
                            onClick={() => advanceStatus(order, next.value)}
                            className="rounded-lg bg-blue-100 px-3 py-1.5 text-[10px] font-black uppercase text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                          >
                            {next.label}
                          </button>
                        )}
                        {CANCELABLE.has(order.status) && (
                          <button
                            type="button"
                            disabled={busyId === order.id}
                            onClick={() => {
                              if (confirm(`Cancel order ${order.order_code}?`)) advanceStatus(order, "cancelled");
                            }}
                            className="rounded-lg bg-red-50 px-3 py-1.5 text-[10px] font-black uppercase text-red-600 hover:bg-red-100 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        )}
                        {!next && !CANCELABLE.has(order.status) && order.payment_status !== "pending_review" && (
                          <span className="text-[10px] font-bold uppercase text-slate-300">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        <Pagination
          currentPage={currentPage}
          totalItems={orders.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </div>

      {reviewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900">Review KBZ Pay Payment</h3>
            <p className="mt-1 text-sm text-slate-500">
              Order <span className="font-bold text-slate-700">{reviewOrder.order_code}</span> — {Number(reviewOrder.total_ks).toLocaleString()} MMK
            </p>

            <div className="mt-5 flex justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-3">
              {reviewOrder.payment_proof_url ? (
                <Image
                  src={reviewOrder.payment_proof_url}
                  alt="Payment screenshot"
                  width={600}
                  height={800}
                  className="max-h-[48vh] w-auto max-w-full object-contain"
                  unoptimized
                />
              ) : (
                <p className="p-10 text-center text-sm font-bold text-slate-400">No screenshot on file.</p>
              )}
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Confirm only after verifying the transaction in the store&apos;s own KBZ Pay/bank records.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setReviewOrder(null)}
                disabled={busyId === reviewOrder.id}
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => submitDecision("rejected")}
                disabled={busyId === reviewOrder.id}
                className="rounded-xl bg-red-50 px-5 py-2.5 text-sm font-black text-red-600 hover:bg-red-100 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => submitDecision("confirmed")}
                disabled={busyId === reviewOrder.id}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
