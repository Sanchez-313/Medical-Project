import pool from "@/config/db";
import { Package, AlertTriangle } from "lucide-react";
import StaffTodoList from "@/components/StaffTodoList";
import StaffAttendanceCard from "@/components/StaffAttendanceCard";
import StaffQuickActions from "@/components/StaffQuickActions";

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <StaffTodoList />
        <StaffAttendanceCard />
      </div>
      <div className="mb-8">
        <StaffQuickActions />
      </div>

      <div id="stock" className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-50 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
              <th className="px-8 py-5">Medicine</th>
              <th className="px-6 py-5">SKU</th>
              <th className="px-6 py-5">Category</th>
              <th className="px-6 py-5">Price (Ks)</th>
              <th className="px-6 py-5">Stock</th>
              <th className="px-6 py-5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {stockRows.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50">
                <td className="px-8 py-5 text-sm font-black text-slate-800">{item.name}</td>
                <td className="px-6 py-5 text-xs font-bold text-slate-500">{item.sku}</td>
                <td className="px-6 py-5 text-xs font-bold text-slate-500">{item.category}</td>
                <td className="px-6 py-5 text-sm font-black text-slate-900">
                  {Number(item.selling_price_ks).toLocaleString()}
                </td>
                <td className="px-6 py-5 text-sm font-bold text-slate-700">{item.stock_qty}</td>
                <td className="px-6 py-5">
                  <span
                    className={`rounded-lg px-3 py-1 text-[10px] font-black uppercase ${
                      item.status === "low" ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
