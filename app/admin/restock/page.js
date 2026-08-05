"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, AlertTriangle, RefreshCw, Save } from "lucide-react";

/** Faithful port of Admin-Dashboard/src/components/LowStockRefill/LowStockRefill.jsx. */
function getNextStatus(stock, reorderLevel) {
  if (stock <= 0) return "expired";
  if (stock <= reorderLevel) return "low";
  return "normal";
}

function SummaryCard({ label, value, tone }) {
  const toneMap = {
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
  };
  return (
    <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
      <div className={`inline-flex rounded-xl px-3 py-1 text-xs font-black ${toneMap[tone] || toneMap.blue}`}>{label}</div>
      <p className="mt-4 text-3xl font-black tracking-tighter text-slate-900">{value}</p>
    </div>
  );
}

export default function RestockPage() {
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  async function loadItems() {
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      const response = await fetch(`/api/admin/medicines?${params}`).then((r) => r.json());
      if (!response.success) throw new Error(response.message);
      setItems(response.data);
    } catch (err) {
      setError(err?.message || "Could not load low-stock items.");
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const lowStockItems = useMemo(
    () =>
      items
        .filter((item) => item.stock_qty <= item.reorder_level)
        .sort((a, b) => a.stock_qty - b.stock_qty || a.id - b.id),
    [items]
  );

  const totalRefillNeeded = useMemo(
    () => lowStockItems.reduce((sum, item) => sum + Math.max(0, item.reorder_level - item.stock_qty), 0),
    [lowStockItems]
  );

  function handleDraftChange(id, value) {
    setDrafts((prev) => ({ ...prev, [String(id)]: Math.max(0, Number(value) || 0) }));
  }

  async function handleRefill(item) {
    const refillQty = Math.max(0, Number(drafts[String(item.id)] || 0));
    if (refillQty <= 0) {
      setError("Please enter a refill quantity greater than 0.");
      return;
    }

    const nextStock = item.stock_qty + refillQty;
    try {
      setSavingId(item.id);
      setError("");
      setSuccessMessage("");
      const response = await fetch("/api/admin/medicines", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          stock_qty: nextStock,
          status: getNextStatus(nextStock, item.reorder_level),
        }),
      }).then((r) => r.json());
      if (!response.success) throw new Error(response.message);

      setItems((prev) =>
        prev.map((entry) =>
          entry.id === item.id
            ? { ...entry, stock_qty: nextStock, status: getNextStatus(nextStock, item.reorder_level) }
            : entry
        )
      );
      setDrafts((prev) => ({ ...prev, [String(item.id)]: 0 }));
      setSuccessMessage(`${item.name} stock updated to ${nextStock}.`);
    } catch (err) {
      setError(err?.message || "Could not update stock.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <header className="mb-8 flex items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Low Stock Refill</h1>
          <p className="pt-3 text-slate-500">
            Refill products below their reorder level and update stock directly from here.
          </p>
        </div>
        <button
          type="button"
          onClick={loadItems}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </header>

      <div className="mb-6 grid grid-cols-3 gap-6">
        <SummaryCard label="Low Stock Items" value={lowStockItems.length} tone="red" />
        <SummaryCard label="Minimum Units Needed" value={totalRefillNeeded} tone="amber" />
        <SummaryCard label="Items Checked" value={items.length} tone="blue" />
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/10"
            placeholder="Search low-stock medicine or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>
      )}
      {successMessage && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {successMessage}
        </div>
      )}

      <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-2 text-sm font-black text-red-600">
            <AlertTriangle size={18} /> Items at or below reorder level
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                <th className="px-6 py-4">Product</th>
                <th className="px-4 py-4">Category</th>
                <th className="px-4 py-4">Current Stock</th>
                <th className="px-4 py-4">Refill Qty</th>
                <th className="px-4 py-4">New Stock</th>
                <th className="px-4 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-sm font-semibold text-slate-400">Loading low-stock items...</td>
                </tr>
              )}
              {!isLoading && lowStockItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-sm font-semibold text-slate-400">No low-stock items found.</td>
                </tr>
              )}
              {!isLoading &&
                lowStockItems.map((item) => {
                  const refillQty = Math.max(0, Number(drafts[String(item.id)] || 0));
                  const nextStock = item.stock_qty + refillQty;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-black text-slate-800">{item.name}</p>
                        <p className="text-[11px] font-semibold text-slate-400">{item.sku}</p>
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-slate-600">{item.category}</td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">{item.stock_qty}</span>
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="number"
                          min="0"
                          value={drafts[String(item.id)] ?? ""}
                          onChange={(e) => handleDraftChange(item.id, e.target.value)}
                          className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/10"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-4 text-sm font-black text-slate-800">{nextStock}</td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => handleRefill(item)}
                          disabled={savingId === item.id}
                          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Save size={14} />
                          {savingId === item.id ? "Saving..." : "Apply Refill"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
