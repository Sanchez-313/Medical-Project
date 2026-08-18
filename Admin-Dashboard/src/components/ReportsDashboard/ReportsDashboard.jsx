import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  BarChart3,
  Calendar,
  AlertTriangle,
  CircleDollarSign,
  ClipboardList,
  MessageSquareText,
  Star,
  PackagePlus,
} from "lucide-react";
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

function getStatusLabelMM(status) {
  const normalized = String(status || "").toLowerCase();
  const labels = {
    delivered: "ပို့ဆောင်ပြီး",
    in_transit: "ပို့ဆောင်နေဆဲ",
    pending: "စောင့်ဆိုင်းနေသည်",
    cancelled: "ပယ်ဖျက်ပြီး",
    delayed: "နောက်ကျနေသည်",
    queued: "စီစဉ်ဆဲ",
  };
  return labels[normalized] || "အခြား";
}

const ReportsDashboard = () => {
  const location = useLocation();
  const [inventory, setInventory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setError("");
      setIsLoading(true);
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
        setError(err.message || "အစီရင်ခံစာဒေတာကို မရယူနိုင်ပါ။");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const report = useMemo(() => {
    const totalStockValue = inventory.reduce(
      (sum, item) => sum + Number(item.stock || 0) * Number(item.price_ks || 0),
      0,
    );
    const lowStockItems = inventory
      .filter((item) => Number(item.stock || 0) <= 10)
      .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0))
      .slice(0, 8);

    const deliveryByStatus = deliveries.reduce((acc, item) => {
      const key = String(item.status || "in_transit").toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const ratingCount = reviews.length;
    const averageRating = ratingCount
      ? (reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / ratingCount).toFixed(1)
      : "0.0";

    return {
      totalStockValue,
      lowStockItems,
      deliveryByStatus,
      totalItems: inventory.length,
      totalCustomers: customers.length,
      totalDeliveries: deliveries.length,
      totalReviews: ratingCount,
      averageRating,
      recentReviews: reviews.slice(0, 5),
    };
  }, [inventory, customers, deliveries, reviews]);

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-['Pyidaungsu','Noto_Sans_Myanmar','Myanmar_Text',sans-serif] text-slate-900">
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col sticky top-0 h-screen shrink-0">
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-10">
            <img src={Logo} alt="Logo" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold tracking-tighter text-indigo-400 uppercase italic">
              AzureMed<span className="text-blue-600"> hub</span>
            </span>
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
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight">အစီရင်ခံစာများ</h1>
            <p className="text-slate-500 pt-3">ကုန်ပစ္စည်း၊ ဖောက်သည်၊ ပို့ဆောင်မှုနှင့် Review အချက်အလက်များ</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
            <Calendar size={14} className="text-blue-600" />
            <span>{new Date().toLocaleDateString("my-MM")}</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-4 gap-6 mb-8">
          <StatCard icon={<Package className="text-blue-600" />} label="ပစ္စည်းစုစုပေါင်း" value={isLoading ? "..." : String(report.totalItems)} />
          <StatCard icon={<Users className="text-purple-600" />} label="ဖောက်သည်စုစုပေါင်း" value={isLoading ? "..." : String(report.totalCustomers)} />
          <StatCard icon={<Truck className="text-emerald-600" />} label="ပို့ဆောင်မှုစုစုပေါင်း" value={isLoading ? "..." : String(report.totalDeliveries)} />
          <StatCard icon={<CircleDollarSign className="text-orange-600" />} label="စတော့တန်ဖိုး (Ks)" value={isLoading ? "..." : `${new Intl.NumberFormat("en-MM").format(report.totalStockValue)} Ks`} />
        </div>

        <div className="grid grid-cols-3 gap-8 mb-8">
          <div className="col-span-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
            <h2 className="text-lg font-black mb-4 flex items-center gap-2">
              <AlertTriangle className="text-orange-500" size={18} />
              စတော့နည်းနေသော ပစ္စည်းများ
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
                    <th className="px-2 py-3">ပစ္စည်းအမည်</th>
                    <th className="px-2 py-3">SKU</th>
                    <th className="px-2 py-3">အမျိုးအစား</th>
                    <th className="px-2 py-3">လက်ကျန်</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {!isLoading &&
                    report.lowStockItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-2 py-3 text-sm font-bold text-slate-800">{item.name}</td>
                        <td className="px-2 py-3 text-xs font-semibold text-slate-500">{item.sku}</td>
                        <td className="px-2 py-3 text-xs font-semibold text-slate-500">{item.category}</td>
                        <td className="px-2 py-3 text-xs font-black text-red-500">{item.stock}</td>
                      </tr>
                    ))}
                  {!isLoading && report.lowStockItems.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-2 py-10 text-sm text-slate-400 font-semibold text-center">
                        စတော့နည်းနေသော ပစ္စည်းမရှိပါ။
                      </td>
                    </tr>
                  )}
                  {isLoading && (
                    <tr>
                      <td colSpan="4" className="px-2 py-10 text-sm text-slate-400 font-semibold text-center">
                        အစီရင်ခံစာဒေတာကို ရယူနေသည်...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
            <h2 className="text-lg font-black mb-4 flex items-center gap-2">
              <ClipboardList className="text-blue-600" size={18} />
              ပို့ဆောင်မှုအခြေအနေ
            </h2>
            <div className="space-y-4">
              {isLoading && <p className="text-sm text-slate-400 font-semibold">ဒေတာကို ရယူနေသည်...</p>}
              {!isLoading &&
                Object.keys(report.deliveryByStatus).map((statusKey) => (
                  <div key={statusKey} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                    <span className="text-sm font-bold text-slate-700">{getStatusLabelMM(statusKey)}</span>
                    <span className="text-sm font-black text-blue-600">{report.deliveryByStatus[statusKey]}</span>
                  </div>
                ))}
              {!isLoading && Object.keys(report.deliveryByStatus).length === 0 && (
                <p className="text-sm text-slate-400 font-semibold">ပို့ဆောင်မှုဒေတာ မရှိသေးပါ။</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-black flex items-center gap-2">
              <MessageSquareText className="text-indigo-600" size={18} />
              အသုံးပြုသူ Review အစီရင်ခံချက်
            </h2>
            <div className="flex items-center gap-5">
              <p className="text-xs font-bold text-slate-500">စုစုပေါင်း: <span className="text-slate-800">{report.totalReviews}</span></p>
              <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                ပျမ်းမျှအမှတ်: <Star size={14} className="text-amber-500 fill-amber-500" /> <span className="text-slate-800">{report.averageRating}</span>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {!isLoading &&
              report.recentReviews.map((review) => (
                <div key={review.id} className="rounded-xl border border-slate-100 px-4 py-3 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black text-slate-800">{review.name}</p>
                    <p className="text-xs font-bold text-amber-600">{'★'.repeat(Number(review.rating || 0))}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{review.title || "Review"}</p>
                  <p className="text-sm text-slate-700 mt-2">{review.comment}</p>
                </div>
              ))}
            {!isLoading && report.recentReviews.length === 0 && (
              <p className="text-sm text-slate-400 font-semibold">Review မရှိသေးပါ။</p>
            )}
            {isLoading && <p className="text-sm text-slate-400 font-semibold">Review ဒေတာကို ရယူနေသည်...</p>}
          </div>
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ icon, label, value }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
    </div>
    <p className="text-2xl font-black tracking-tight">{value}</p>
  </div>
);

export default ReportsDashboard;
