"use client";

import { useEffect, useState } from "react";
import { Package, AlertTriangle } from "lucide-react";
import StaffQuickActions from "@/components/StaffQuickActions";
import StaffStockTable from "@/components/StaffStockTable";

const POLL_INTERVAL_MS = 5000;

/**
 * Client island for the whole Staff dashboard body (stat tiles + quick
 * actions + stock table) — pulled out of app/staff/page.js (a server
 * component, for the initial DB query) so it can poll for live stock
 * changes and hold the "Low Stock Items" filter without a manual refresh.
 * A restock elsewhere, or another staff member adjusting stock_qty, has no
 * event that reaches this page otherwise.
 */
export default function StaffDashboardView({ initialStockRows }) {
  const [stockRows, setStockRows] = useState(initialStockRows);
  const [filter, setFilter] = useState("all"); // "all" | "low"

  useEffect(() => {
    const interval = setInterval(async () => {
      const result = await fetch("/api/staff/medicines").then((r) => r.json());
      if (result.success) setStockRows(result.data);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const lowStockCount = stockRows.filter((item) => item.status === "low").length;
  const visibleRows = filter === "low" ? stockRows.filter((item) => item.status === "low") : stockRows;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">ကုန်ပစ္စည်းစတော့</h1>
        <p className="pt-3 text-slate-500">
          Operational stock view. Cost price and revenue totals are owner-only and not shown here.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`flex items-center gap-5 rounded-[2rem] border p-6 text-left shadow-sm transition-colors ${
            filter === "all" ? "border-blue-200 bg-blue-50/40" : "border-slate-100 bg-white hover:border-blue-100"
          }`}
        >
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
            <Package className="text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Products Tracked</p>
            <p className="text-2xl font-black tracking-tighter text-slate-900">{stockRows.length}</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setFilter((prev) => (prev === "low" ? "all" : "low"))}
          className={`flex items-center gap-5 rounded-[2rem] border p-6 text-left shadow-sm transition-colors ${
            filter === "low" ? "border-orange-300 bg-orange-50" : "border-slate-100 bg-white hover:border-orange-100"
          }`}
        >
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-orange-50">
            <AlertTriangle className="text-orange-500" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Low Stock Items</p>
            <p className="text-2xl font-black tracking-tighter text-slate-900">{lowStockCount}</p>
          </div>
        </button>
      </div>

      <div className="mb-8">
        <StaffQuickActions />
      </div>

      <div id="stock">
        {filter === "low" && (
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-orange-200 bg-orange-50 px-5 py-3 text-sm font-semibold text-orange-700">
            <span>
              Showing {lowStockCount} low-stock item{lowStockCount === 1 ? "" : "s"}.
            </span>
            <button type="button" onClick={() => setFilter("all")} className="font-black underline">
              Clear filter
            </button>
          </div>
        )}
        {/* key={filter} remounts the table so its internal pagination resets
            to page 1 whenever the filter changes, instead of possibly
            landing on a now-out-of-range page. */}
        <StaffStockTable key={filter} stockRows={visibleRows} />
      </div>
    </div>
  );
}
