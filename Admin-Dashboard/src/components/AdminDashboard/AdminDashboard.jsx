import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  BarChart3,
  Search,
  Bell,
  Plus,
  Calendar,
  TrendingUp,
  AlertCircle,
  History,
  ChevronRight,
  Leaf,
  Layers,
  Banknote
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import Logo from "../../assets/Logo/logo.png";

const AdminDashboard = () => {
  const location = useLocation();

  // Updated currency data for MMK
  const data = [
    { name: "Jan", revenue: 4500000 },
    { name: "Feb", revenue: 3800000 },
    { name: "Mar", revenue: 5200000 },
    { name: "Apr", revenue: 4900000 },
    { name: "May", revenue: 6100000 },
    { name: "Jun", revenue: 5800000 },
    { name: "Jul", revenue: 7500000 },
  ];

  // Localized Stats (Kyats & Myanmar context)
  const stats = [
    { label: "စုစုပေါင်း ရောင်းအား", value: "၇.၅ သန်း", trend: "+12.5%", isUp: true, icon: <TrendingUp className="text-emerald-500" /> },
    { label: "ပို့ဆောင်ဆဲ အော်ဒါ", value: "၁၂၄", trend: "-2.4%", isUp: false, icon: <Truck className="text-blue-500" /> },
    { label: "လက်ကျန်နည်းဆေးဝါး", value: "၁၈", trend: "+5.0%", isUp: true, icon: <AlertCircle className="text-orange-500" /> },
    { label: "ဖောက်သည်သစ်", value: "၃၂", trend: "+8.1%", isUp: true, icon: <Users className="text-purple-500" /> },
  ];

  const activities = [
    { title: "ပို့ဆောင်မှု #ORD-2482 ပြီးမြောက်သည်", time: "12 mins ago", color: "bg-emerald-500" },
    { title: "အော်ဒါအသစ်: BPI Amoxicillin", time: "45 mins ago", color: "bg-blue-500" },
    { title: "လက်ကျန်နည်း: Decolgen Forte", time: "2 hrs ago", color: "bg-orange-500" },
  ];

  const navItems = [
    { name: "Dashboard", path: "/overview", icon: <LayoutDashboard size={20} /> },
    { name: "ဆေးဝါးစာရင်း", path: "/inventory", icon: <Package size={20} /> },
    { name: "ဖောက်သည်များ", path: "/customers", icon: <Users size={20} /> },
    { name: "ပို့ဆောင်ရေး", path: "/deliveries", icon: <Truck size={20} /> },
    { name: "အစီရင်ခံစာ", path: "/reports", icon: <BarChart3 size={20} /> },
  ];

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans text-slate-900">
      {/* Side Navigation (Same Style) */}
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

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="flex items-center justify-between mb-10">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all" 
              placeholder="ဆေးအမည်ဖြင့် ရှာဖွေရန်..." 
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-all">
              <Plus size={18} /> အသစ်ထည့်သွင်းရန်
            </button>
          </div>
        </header>

        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">လုပ်ငန်းအနှစ်ချုပ်</h2>
            <p className="text-slate-500 font-medium pt-4">မြန်မာနိုင်ငံရှိ ဆေးဝါးသိုလှောင်မှုနှင့် ဖြန့်ဖြူးမှုအခြေအနေ။</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
            <Calendar size={14} className="text-blue-600" />
            <span>ယနေ့: {new Date().toLocaleDateString('my-MM')}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="flex justify-between mb-4">
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">{stat.label}</span>
                <div className="p-2 bg-slate-50 rounded-lg">{stat.icon}</div>
              </div>
              <p className="text-2xl font-black tracking-tighter">{stat.value} <span className="text-xs text-slate-400">Ks</span></p>
              <p className={`text-[10px] font-black mt-1 ${stat.isUp ? "text-emerald-500" : "text-red-500"}`}>
                {stat.trend} <span className="text-slate-400">တိုးတက်မှု</span>
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Revenue Chart */}
          <div className="col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-lg tracking-tight">ဝင်ငွေစစ်ဆေးမှု (ကျပ်)</h3>
              <select className="bg-slate-50 border-none rounded-lg text-[10px] font-black p-2 uppercase tracking-widest outline-none">
                <option>ပြီးခဲ့သည့် ၇ လ</option>
              </select>
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
                  <Tooltip 
                    formatter={(value) => [`${value.toLocaleString()} Ks`, 'ဝင်ငွေ']}
                    contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontWeight: "700" }} 
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
            <h3 className="text-lg font-black flex items-center gap-2 mb-8 tracking-tight">
              <History className="text-blue-600" size={20} /> လတ်တလော လှုပ်ရှားမှု
            </h3>
            <div className="space-y-8 flex-1">
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
      </main>
    </div>
  );
};

export default AdminDashboard;