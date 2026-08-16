"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Calendar,
  TrendingUp,
  AlertCircle,
  History,
  ChevronRight,
  ShoppingBag,
  Users,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/**
 * Faithful port of Admin-Dashboard/src/components/AdminDashboard/AdminDashboard.jsx.
 * Same stat-card grid / area-chart / activity-feed layout and Myanmar copy.
 * Data source changed from the old app's inventory+deliveries+reviews API to
 * this project's real medicines/sales/users tables via /api/admin/overview —
 * "active deliveries" and the reviews panel from the original don't have a
 * backing table in this schema yet, so those two stats/sections were swapped
 * for real equivalents (total sales) or dropped, rather than faked.
 */
export default function AdminDashboardPage() {
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    fetch("/api/admin/overview")
      .then((r) => r.json())
      .then((result) => {
        if (!mounted) return;
        if (!result.success) {
          setError(result.message || "ဒက်ရှ်ဘုတ်အကျဉ်းချုပ်ကို မရယူနိုင်ပါ။");
          return;
        }
        setOverview(result.data);
      })
      .catch(() => mounted && setError("ဒက်ရှ်ဘုတ်အကျဉ်းချုပ်ကို မရယူနိုင်ပါ။"));
    return () => {
      mounted = false;
    };
  }, []);

  const stats = overview
    ? [
        {
          label: "ခန့်မှန်းစတော့တန်ဖိုး",
          value: `${new Intl.NumberFormat("en-MM").format(overview.totalStockValueKs)} MMK`,
          icon: <TrendingUp className="text-emerald-500" />,
        },
        {
          label: "စုစုပေါင်းအရောင်း",
          value: String(overview.totalSalesCount),
          icon: <ShoppingBag className="text-blue-500" />,
        },
        {
          label: "စတော့နည်းပစ္စည်း",
          value: String(overview.lowStockCount),
          icon: <AlertCircle className="text-orange-500" />,
        },
        {
          label: "မှတ်ပုံတင်အသုံးပြုသူ",
          value: String(overview.registeredCustomerCount),
          icon: <Users className="text-purple-500" />,
        },
      ]
    : [];

  const chartData = (overview?.monthlyRevenue ?? []).map((row) => ({
    name: row.month,
    revenue: Number(row.revenueKs),
  }));

  return (
    <div>
      <header className="flex items-center justify-between mb-10">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
            placeholder="ရှာဖွေရန်..."
            disabled
          />
        </div>
      </header>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">ခြုံငုံသုံးသပ်ချက်</h2>
          <p className="text-slate-500 font-medium pt-4">
            ကုန်ပစ္စည်း၊ အသုံးပြုသူနှင့် အရောင်းဒေတာကို တိုက်ရိုက်ပြသထားသည်။
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
          <Calendar size={14} className="text-blue-600" />
          <span>{new Date().toLocaleDateString("my-MM")}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between mb-4">
              <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">{stat.label}</span>
              <div className="p-2 bg-slate-50 rounded-lg">{stat.icon}</div>
            </div>
            <p className="text-2xl font-black tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-lg tracking-tight">ဝင်ငွေလမ်းကြောင်း (လအလိုက်)</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }} dy={10} />
                <YAxis hide />
                <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} MMK`, "ဝင်ငွေ"]} />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-lg font-black flex items-center gap-2 mb-8 tracking-tight">
            <History className="text-blue-600" size={20} /> နောက်ဆုံးအရောင်းလှုပ်ရှားမှု
          </h3>
          <div className="space-y-8 flex-1">
            {(overview?.recentSales ?? []).length === 0 && (
              <p className="text-sm text-slate-400 font-semibold">အရောင်းလှုပ်ရှားမှု မရှိသေးပါ။</p>
            )}
            {(overview?.recentSales ?? []).map((sale) => (
              <div key={sale.sale_code} className="flex gap-4">
                <div className="size-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-slate-800 leading-tight">
                    {sale.sale_code}: {sale.customer_name ?? "Walk-in"}
                  </p>
                  <p className="text-[10px] font-black text-slate-400 mt-1 uppercase">
                    {Number(sale.total_ks).toLocaleString()} MMK &middot; {sale.payment_method}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <a
            href="/admin/orders"
            className="mt-8 py-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 transition-all rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 group"
          >
            လှုပ်ရှားမှုအားလုံးကြည့်ရန် <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  );
}
