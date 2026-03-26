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
  ClipboardList,
  UserRound,
  Building2,
} from "lucide-react";
import Logo from "../../assets/Logo/logo.png";
import { getDeliveries } from "../../lib/api";

const navItems = [
  { name: "ဒက်ရှ်ဘုတ်", path: "/overview", icon: <LayoutDashboard size={20} /> },
  { name: "ကုန်ပစ္စည်းစာရင်း", path: "/inventory", icon: <Package size={20} /> },
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

function formatDateTime(value) {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getHandoffTime(status, value) {
  return String(status || "").toLowerCase() === "queued" ? "" : formatDateTime(value);
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

const OrderHandoff = () => {
  const location = useLocation();
  const [deliveries, setDeliveries] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadOrders() {
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
        setError(err.message || "အော်ဒါဒေတာကို မရယူနိုင်ပါ။");
        setDeliveries([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadOrders();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredOrders = useMemo(() => {
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

  const pendingOrders = useMemo(
    () => filteredOrders.filter((delivery) => String(delivery.status).toLowerCase() === "queued"),
    [filteredOrders],
  );

  const handedOffOrders = useMemo(
    () => filteredOrders.filter((delivery) => String(delivery.status).toLowerCase() !== "queued"),
    [filteredOrders],
  );

  const activeOrder = filteredOrders.find((delivery) => delivery.id === selectedId) || filteredOrders[0] || null;

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-['Pyidaungsu','Noto_Sans_Myanmar','Myanmar_Text',sans-serif] text-slate-900">
      <aside className="sticky top-0 h-screen w-64 shrink-0 border-r border-slate-200 bg-white">
        <div className="flex h-full flex-col p-6">
          <div className="mb-10 flex items-center gap-2">
            <img src={Logo} alt="Logo" className="h-10 w-10 object-contain" />
            <span className="text-xl font-bold uppercase italic tracking-tighter text-indigo-400">
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
          <h1 className="text-2xl font-black text-slate-900">အော်ဒါများ</h1>
          <p className="text-sm text-slate-500">
            Point သို့ လက်လွှဲပြီးသော order များနှင့် မလွှဲရသေးသော order များကို ဒီ page ထဲမှာသီးသန့်စစ်နိုင်ပါသည်
          </p>
        </header>

        <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)]">
          <div className="mx-auto max-w-6xl p-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
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

            {isLoading && <p className="mt-6 text-sm font-semibold text-slate-400">အော်ဒါများကို ရယူနေသည်...</p>}
            {!isLoading && error && <p className="mt-6 text-sm font-semibold text-red-500">{error}</p>}

            {!isLoading && !error && (
              <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[1fr_1fr_0.95fr]">
                <OrderColumn
                  title="Point သို့ မအပ်ရသေးသော orders"
                  count={pendingOrders.length}
                  accent="amber"
                  orders={pendingOrders}
                  activeId={selectedId}
                  onSelect={setSelectedId}
                />

                <OrderColumn
                  title="Point သို့ အပ်ပြီးသော orders"
                  count={handedOffOrders.length}
                  accent="blue"
                  orders={handedOffOrders}
                  activeId={selectedId}
                  onSelect={setSelectedId}
                />

                <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-black tracking-widest text-slate-400">ရွေးထားသော order</p>

                  {activeOrder ? (
                    <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-black text-slate-900">{activeOrder.order_code}</p>
                          <p className="mt-1 text-sm font-bold text-slate-600">{activeOrder.customer_name}</p>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-[11px] font-black ${getStatusBadge(activeOrder.status)}`}>
                          {formatStatusMM(activeOrder.status)}
                        </span>
                      </div>

                      <div className="mt-5 space-y-4">
                        <InfoRow icon={<Building2 size={16} />} label="လိပ်စာ" value={activeOrder.hospital} />
                        <InfoRow icon={<Truck size={16} />} label="အေဂျင်စီ" value={activeOrder.courier} />
                        <InfoRow icon={<Clock size={16} />} label="handoff time" value={getHandoffTime(activeOrder.status, activeOrder.updated_at) || "-"} />
                      </div>
                    </div>
                  ) : (
                    <p className="mt-6 text-sm font-semibold text-slate-400">ကြည့်လိုသော order ကိုရွေးပါ။</p>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const OrderColumn = ({ title, count, accent, orders, activeId, onSelect }) => {
  const accentClasses =
    accent === "amber"
      ? "border-amber-100 bg-amber-50/70 text-amber-700"
      : "border-blue-100 bg-blue-50/70 text-blue-700";

  return (
    <section className={`rounded-[2rem] border p-6 shadow-sm ${accentClasses}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black">{title}</p>
        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-slate-700">{count} ခု</span>
      </div>

      <div className="mt-5 max-h-[560px] space-y-3 overflow-y-auto pr-1">
        {orders.length > 0 ? (
          orders.map((order) => {
            const isActive = activeId === order.id;
            return (
              <button
                key={order.id}
                type="button"
                onClick={() => onSelect(order.id)}
                className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${
                  isActive
                    ? "border-blue-200 bg-white shadow-sm"
                    : "border-transparent bg-white/90 hover:border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-900">{order.order_code}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{order.customer_name}</p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${getStatusBadge(order.status)}`}>
                    {formatStatusMM(order.status)}
                  </span>
                </div>

                <p className="mt-3 text-xs font-semibold text-slate-600">{order.hospital}</p>
                <p className="mt-2 text-xs font-semibold text-slate-500">{getHandoffTime(order.status, order.updated_at) || "handoff time မရှိသေး"}</p>
              </button>
            );
          })
        ) : (
          <div className="rounded-2xl bg-white p-5 text-sm font-bold text-slate-500">အော်ဒါမရှိပါ။</div>
        )}
      </div>
    </section>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 rounded-xl bg-white px-4 py-3">
    <div className="mt-0.5 text-slate-400">{icon}</div>
    <div>
      <p className="text-[11px] font-black tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-900">{value}</p>
    </div>
  </div>
);

export default OrderHandoff;
