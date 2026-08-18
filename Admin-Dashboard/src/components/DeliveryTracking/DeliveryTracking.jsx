import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  BarChart3,
  Search,
  Clock,
  LoaderCircle,
  UserRound,
  Building2,
  ClipboardList,
  PackagePlus,
} from "lucide-react";
import Logo from "../../assets/Logo/logo.png";
import { getDeliveries, updateDelivery } from "../../lib/api";

const navItems = [
  { name: "ဒက်ရှ်ဘုတ်", path: "/overview", icon: <LayoutDashboard size={20} /> },
  { name: "ကုန်ပစ္စည်းစာရင်း", path: "/inventory", icon: <Package size={20} /> },
  { name: "Restock", path: "/restock", icon: <PackagePlus size={20} /> },
  { name: "ဖောက်သည်များ", path: "/customers", icon: <Users size={20} /> },
  { name: "ပို့ဆောင်မှုများ", path: "/deliveries", icon: <Truck size={20} /> },
  { name: "အော်ဒါများ", path: "/orders", icon: <ClipboardList size={20} /> },
  { name: "အစီရင်ခံစာများ", path: "/reports", icon: <BarChart3 size={20} /> },
];

function formatStatusMM(status) {
  const key = String(status || "").toLowerCase();
  const mapping = {
    queued: "Point သို့ မအပ်ရသေး",
    in_transit: "Point သို့ အပ်ပြီး",
    delivered: "Point မှ ပို့ဆောင်ပြီး",
    delayed: "Point နှောင့်နှေးနေသည်",
  };

  return mapping[key] || "Point သို့ မအပ်ရသေး";
}

function getStatusBadge(status) {
  const key = String(status || "").toLowerCase();
  if (key === "in_transit") return "bg-blue-50 text-blue-700 border-blue-200";
  if (key === "delivered") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (key === "delayed") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function normalizeDelivery(delivery) {
  return {
    ...delivery,
    courier:
      !delivery?.courier || String(delivery.courier).toLowerCase() === "azuremed courier"
        ? "Point"
        : delivery.courier,
    customer_name: delivery?.customer_name || "Alex Rivers",
  };
}

function formatDateTime(value) {
  if (!value) return "19/03/2026, 20:33";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  return parsed.toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const DeliveryTracking = () => {
  const location = useLocation();
  const [deliveries, setDeliveries] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadDeliveries() {
      setIsLoading(true);
      setError("");
      try {
        const response = await getDeliveries();
        const list = (response?.data?.deliveries || []).map(normalizeDelivery);
        if (!mounted) return;
        setDeliveries(list);
        setSelectedId((prev) => prev || list[0]?.id || null);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "ပို့ဆောင်မှုဒေတာကို မရယူနိုင်ပါ။");
        setDeliveries([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadDeliveries();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredDeliveries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return deliveries;

    return deliveries.filter((delivery) => {
      return (
        String(delivery.order_code || "").toLowerCase().includes(query) ||
        String(delivery.customer_name || "").toLowerCase().includes(query) ||
        String(delivery.hospital || "").toLowerCase().includes(query)
      );
    });
  }, [deliveries, searchQuery]);

  const activeDelivery =
    filteredDeliveries.find((delivery) => delivery.id === selectedId) || filteredDeliveries[0] || null;

  const handleStatusChange = async (delivery, nextStatus) => {
    if (!delivery) return;

    const statusDefaults = {
      queued: { progress: 10, etaText: "Point သို့ မအပ်ရသေး" },
      in_transit: { progress: Math.max(45, Number(delivery.progress || 0)), etaText: "Point သို့ အပ်ပြီး" },
    };

    const nextProgress = statusDefaults[nextStatus]?.progress ?? Math.max(10, Number(delivery.progress || 0));
    const nextEta = statusDefaults[nextStatus]?.etaText ?? "Point သို့ မအပ်ရသေး";

    try {
      setSavingId(delivery.id);
      setError("");
      await updateDelivery(delivery.id, {
        eta_text: nextEta,
        progress: nextProgress,
        status: nextStatus,
      });

      setDeliveries((prev) =>
        prev.map((item) =>
          item.id === delivery.id
            ? {
                ...item,
                eta_text: nextEta,
                progress: nextProgress,
                status: nextStatus,
                updated_at: new Date().toISOString(),
              }
            : item,
        ),
      );
    } catch (err) {
      setError(err.message || "ပို့ဆောင်မှုအခြေအနေကို မပြောင်းနိုင်ပါ။");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-['Pyidaungsu','Noto_Sans_Myanmar','Myanmar_Text',sans-serif] text-slate-900">
      <aside className="sticky top-0 h-screen w-64 shrink-0 border-r border-slate-200 bg-white">
        <div className="flex h-full flex-col p-6">
          <div className="mb-10 flex items-center gap-2">
            <img src={Logo} alt="Logo" className="h-10 w-10 object-contain" />
            <span className="text-xl font-bold tracking-tighter text-indigo-400 uppercase italic">
                AzureMed<span className="text-blue-600"> hub</span>
              </span>
          </div>

          <nav className="flex flex-grow flex-col gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <main className="flex h-screen flex-1 flex-col overflow-hidden bg-white">
        <header className="shrink-0 border-b border-slate-200 p-6">
          <h1 className="text-2xl font-black text-slate-900">ပို့ဆောင်မှုများ</h1>
          <p className="text-sm text-slate-500">
            ဒီ page မှာ Point agency ကို handoff status ပြောင်းတာနဲ့ delivery details ကိုပဲစီမံနိုင်ပါသည်
          </p>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-[420px] overflow-y-auto border-r border-slate-100 bg-white">
            <div className="border-b border-slate-50 bg-slate-50/40 p-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/10"
                  placeholder="အော်ဒါနံပါတ်၊ ဖောက်သည်၊ လိပ်စာဖြင့် ရှာဖွေရန်..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {isLoading && <p className="p-6 text-sm font-semibold text-slate-400">ပို့ဆောင်မှုများကို ရယူနေသည်...</p>}
            {!isLoading && error && <p className="p-6 text-sm font-semibold text-red-500">{error}</p>}
            {!isLoading && !error && filteredDeliveries.length === 0 && (
              <p className="p-6 text-sm font-semibold text-slate-400">ပို့ဆောင်မှုမတွေ့ပါ။</p>
            )}

            {!isLoading &&
              !error &&
              filteredDeliveries.map((delivery) => {
                const isActive = selectedId === delivery.id || (!selectedId && filteredDeliveries[0]?.id === delivery.id);
                return (
                  <button
                    key={delivery.id}
                    type="button"
                    onClick={() => setSelectedId(delivery.id)}
                    className={`w-full border-b border-slate-50 p-6 text-left transition-all ${
                      isActive ? "border-l-4 border-l-blue-600 bg-blue-50/60" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className={`rounded-lg px-3 py-1 text-xs font-black ${isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                        {delivery.order_code}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-black ${getStatusBadge(delivery.status)}`}>
                        {formatStatusMM(delivery.status)}
                      </span>
                    </div>

                    <h3 className="mt-4 text-xl font-black text-slate-900">{delivery.hospital}</h3>
                    <div className="mt-3 text-sm font-bold text-slate-600">{delivery.customer_name}</div>
                  </button>
                );
              })}
          </div>

          <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)]">
            {activeDelivery ? (
              <div className="mx-auto max-w-5xl p-8">
                <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.3fr_0.9fr]">
                  <section className="rounded-[2rem] border border-blue-100 bg-white/90 p-8 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black tracking-widest text-slate-400">delivery detail</p>
                        <h2 className="mt-2 text-3xl font-black text-slate-900">{activeDelivery.order_code}</h2>
                        <p className="mt-2 text-sm text-slate-500">
                          လက်ရှိရွေးထားသော delivery ၏ handoff အခြေအနေကို ဒီနေရာမှာကြည့်ရှုနိုင်ပါသည်
                        </p>
                      </div>
                      <span className={`rounded-full border px-4 py-2 text-xs font-black ${getStatusBadge(activeDelivery.status)}`}>
                        {formatStatusMM(activeDelivery.status)}
                      </span>
                    </div>

                    <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
                      <DetailCard icon={<UserRound size={18} />} label="ဖောက်သည်အမည်" value={activeDelivery.customer_name} />
                      <DetailCard icon={<Building2 size={18} />} label="ပို့ဆောင်မည့်လိပ်စာ" value={activeDelivery.hospital} />
                      <DetailCard icon={<Truck size={18} />} label="အေဂျင်စီ" value={activeDelivery.courier} />
                      <DetailCard icon={<Clock size={18} />} label="handoff time" value={formatDateTime(activeDelivery.updated_at)} />
                    </div>
                  </section>

                  <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                    <p className="text-xs font-black tracking-widest text-slate-400">handoff control</p>
                    <h3 className="mt-2 text-2xl font-black text-slate-900">Point သို့ လက်လွှဲခြင်း</h3>
                    <p className="mt-2 text-sm text-slate-500">
                      order pack ကို Point agency ထံ အပ်ပြီးပြီလား မအပ်ရသေးလား ဆိုတာကို ဒီခလုတ်နှစ်ခုနဲ့ update လုပ်နိုင်ပါသည်
                    </p>

                    <div className="mt-6 grid gap-4">
                      <button
                        type="button"
                        disabled={savingId === activeDelivery.id || activeDelivery.status === "queued"}
                        onClick={() => handleStatusChange(activeDelivery, "queued")}
                        className="flex items-center justify-center gap-2 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingId === activeDelivery.id ? <LoaderCircle size={16} className="animate-spin" /> : <Clock size={16} />}
                        Point သို့ မအပ်ရသေး
                      </button>

                      <button
                        type="button"
                        disabled={savingId === activeDelivery.id || activeDelivery.status === "in_transit" || activeDelivery.status === "delivered"}
                        onClick={() => handleStatusChange(activeDelivery, "in_transit")}
                        className="flex items-center justify-center gap-2 rounded-[1.25rem] border border-blue-200 bg-blue-50 px-4 py-4 text-sm font-black text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingId === activeDelivery.id ? <LoaderCircle size={16} className="animate-spin" /> : <Truck size={16} />}
                        Point သို့ အပ်ပြီး
                      </button>
                    </div>
                  </aside>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center font-semibold text-slate-400">
                ပို့ဆောင်မှုတစ်ခုကို ရွေးချယ်ပြီး အသေးစိတ်ကြည့်ရှုပါ
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const DetailCard = ({ icon, label, value }) => (
  <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 px-5 py-4">
    <div className="flex items-center gap-2 text-slate-400">
      {icon}
      <span className="text-[10px] font-black tracking-widest">{label}</span>
    </div>
    <p className="mt-3 text-base font-black text-slate-900">{value}</p>
  </div>
);

export default DeliveryTracking;
