import pool from "@/config/db";
import { Package, AlertTriangle } from "lucide-react";
import StaffQuickActions from "@/components/StaffQuickActions";
import StaffStockTable from "@/components/StaffStockTable";

// The parent layout's getServerSession() call doesn't reliably signal
// dynamic rendering to Next's static analysis (it's wrapped several layers
// deep, not a direct cookies()/headers() call) — without this, the page
// gets silently build-time prerendered, which tries to connect to the DB at
// build time and fails on hosts (Vercel) that can't reach it.
export const dynamic = "force-dynamic";

/**
 * Staff stock view — never selects cost_price_ks or revenue; this is a
 * different query from app/admin, not the same one with fields hidden.
 */
export default async function StaffDashboardPage() {
  const [stockRows] = await pool.query(
    `SELECT id, name, sku, category, selling_price_ks, stock_qty, status
     FROM medicines
     WHERE is_active = 1
     ORDER BY name ASC`
  );

  const lowStockCount = stockRows.filter((item) => item.status === "low").length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">ကုန်ပစ္စည်းစတော့</h1>
        <p className="pt-3 text-slate-500">
          Operational stock view. Cost price and revenue totals are owner-only and not shown here.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="flex items-center gap-5 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
            <Package className="text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Products Tracked</p>
            <p className="text-2xl font-black tracking-tighter text-slate-900">{stockRows.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-5 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-orange-50">
            <AlertTriangle className="text-orange-500" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Low Stock Items</p>
            <p className="text-2xl font-black tracking-tighter text-slate-900">{lowStockCount}</p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <StaffQuickActions />
      </div>

      <div id="stock">
        <StaffStockTable stockRows={stockRows} />
      </div>
    </div>
  );
}
