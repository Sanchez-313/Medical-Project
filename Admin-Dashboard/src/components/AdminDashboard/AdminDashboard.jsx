import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  BarChart3,
  ClipboardList,
  Search,
  Calendar,
  TrendingUp,
  AlertCircle,
  History,
  ChevronRight,
  PackagePlus,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Logo from "../../assets/Logo/logo.png";
import { getCustomers, getDeliveries, getInventory, getReviews } from "../../lib/api";

const navItems = [
  { name: "ဒက်ရှ်ဘုတ်", path: "/overview", icon: <LayoutDashboard size={20} /> },
  { name: "ကုန်ပစ္စည်းစာရင်း", path: "/inventory", icon: <Package size={20} /> },
  { name: "Restock", path: "/restock", icon: <PackagePlus size={20} /> },
  { name: "ဖောက်သည်များ", path: "/customers", icon: <Users size={20} /> },
  { name: "ပို့ဆောင်မှုများ", path: "/deliveries", icon: <Truck size={20} /> },
  { name: "အော်ဒါများ", path: "/orders", icon: <ClipboardList size={20} /> },
  { name: "အစီရင်ခံစာများ", path: "/reports", icon: <BarChart3 size={20} /> },
];

const data = [
  { name: "ဇန်", revenue: 4500000 },
  { name: "ဖေ", revenue: 3800000 },
  { name: "မတ်", revenue: 5200000 },
  { name: "ဧ", revenue: 4900000 },
  { name: "မေ", revenue: 6100000 },
  { name: "ဇွန်", revenue: 5800000 },
  { name: "ဇူ", revenue: 7500000 },
];

const AdminDashboard = () => {
  const location = useLocation();
  const [inventory, setInventory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadSummary() {
      setError("");
      try {
        const [inventoryRes, customersRes, deliveriesRes, reviewsRes] = await Promise.all([
          getInventory(),
          getCustomers(),
          getDeliveries(),
          getReviews(),
        ]);
        if (!mounted) return;
        setInventory(inventoryRes?.data?.items || []);
        setCustomers(customersRes?.data?.customers || []);
        setDeliveries(deliveriesRes?.data?.deliveries || []);
        setReviews(reviewsRes?.data?.reviews || []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "ဒက်ရှ်ဘုတ်အကျဉ်းချုပ်ကို မရယူနိုင်ပါ။");
      }
    }

    loadSummary();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const lowStock = inventory.filter((item) => Number(item.stock || 0) <= 10).length;
    const totalRevenueEstimate = inventory.reduce(
      (sum, item) => sum + Number(item.stock || 0) * Number(item.price_ks || 0),
      0,
    );
    return [
      {
        label: "ခန့်မှန်းစတော့တန်ဖိုး",
        value: `${new Intl.NumberFormat("en-MM").format(totalRevenueEstimate)} Ks`,
        trend: "တိုက်ရိုက်",
        isUp: true,
        icon: <TrendingUp className="text-emerald-500" />,
      },
      {
        label: "လုပ်ဆောင်နေသောပို့ဆောင်မှု",
        value: String(deliveries.length),
        trend: "တိုက်ရိုက်",
        isUp: true,
        icon: <Truck className="text-blue-500" />,
      },
      {
        label: "စတော့နည်းပစ္စည်း",
        value: String(lowStock),
        trend: "တိုက်ရိုက်",
        isUp: lowStock <= 5,
        icon: <AlertCircle className="text-orange-500" />,
      },
      {
        label: "မှတ်ပုံတင်အသုံးပြုသူ",
        value: String(customers.length),
        trend: "တိုက်ရိုက်",
        isUp: true,
        icon: <Users className="text-purple-500" />,
      },
    ];
  }, [inventory, customers, deliveries]);

  const activities = useMemo(() => {
    return deliveries.slice(0, 3).map((delivery) => ({
      title: `${delivery.order_code}: ${delivery.hospital}`,
      time: delivery.eta_text || "ပို့ဆောင်နေဆဲ",
      color: delivery.status === "delivered" ? "bg-emerald-500" : "bg-blue-500",
    }));
  }, [deliveries]);

  const recentReviews = useMemo(() => reviews.slice(0, 4), [reviews]);

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-['Pyidaungsu','Noto_Sans_Myanmar','Myanmar_Text',sans-serif] text-slate-900">
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col sticky top-0 h-screen shrink-0">
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-10 group">
            <img src={Logo} alt="Logo" className="w-10 h-10 object-contain" />
            <div className="flex flex-col leading-none">
              <span className="text-xl font-bold tracking-tighter text-indigo-400 uppercase italic">
                AzureMed<span className="text-blue-600"> hub</span>
              </span>
            </div>
          </div>

          <nav className="flex flex-col gap-2 flex-grow">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {item.icon} {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <header className="flex items-center justify-between mb-10">
            <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
              placeholder="ရှာဖွေရန်..."
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
            <p className="text-slate-500 font-medium pt-4">ဘက်အင်ဒ်ရှိ ကုန်ပစ္စည်း၊ အသုံးပြုသူနှင့် ပို့ဆောင်ရေးဒေတာကို တိုက်ရိုက်ပြသထားသည်။</p>
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
              <p className={`text-[10px] font-black mt-1 ${stat.isUp ? "text-emerald-500" : "text-red-500"}`}>
                {stat.trend}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-lg tracking-tight">ဝင်ငွေလမ်းကြောင်း (နမူနာ)</h3>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }} dy={10} />
                  <YAxis hide />
                  <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} Ks`, "ဝင်ငွေ"]} />
                  <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
            <h3 className="text-lg font-black flex items-center gap-2 mb-8 tracking-tight">
              <History className="text-blue-600" size={20} /> နောက်ဆုံးပို့ဆောင်မှုလှုပ်ရှားမှု
            </h3>
            <div className="space-y-8 flex-1">
              {activities.length === 0 && <p className="text-sm text-slate-400 font-semibold">ပို့ဆောင်မှုလှုပ်ရှားမှု မရှိသေးပါ။</p>}
              {activities.map((act, i) => (
                <div key={i} className="flex gap-4">
                  <div className={`size-2 rounded-full ${act.color} mt-2 shrink-0`} />
                  <div>
                    <p className="text-sm font-bold text-slate-800 leading-tight">{act.title}</p>
                    <p className="text-[10px] font-black text-slate-400 mt-1 uppercase">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-8 py-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 transition-all rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 group">
              လှုပ်ရှားမှုအားလုံးကြည့်ရန် <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        <div className="mt-8 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-black text-lg tracking-tight">Review</h3>
            <p className="text-xs font-bold text-slate-500">
              စုစုပေါင်း: <span className="text-slate-800">{reviews.length}</span>
            </p>
          </div>
          <div className="space-y-3">
            {recentReviews.map((review) => (
              <div key={review.id} className="rounded-xl border border-slate-100 px-4 py-3 bg-slate-50/50">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-800">{review.name}</p>
                  <p className="text-xs font-bold text-amber-600">{"★".repeat(Number(review.rating || 0))}</p>
                </div>
                <p className="text-xs text-slate-500 mt-1">{review.title || "Review"}</p>
                <p className="text-sm text-slate-700 mt-2">{review.comment}</p>
              </div>
            ))}
            {!recentReviews.length && (
              <p className="text-sm text-slate-400 font-semibold">Review မရှိသေးပါ။</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;


