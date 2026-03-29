import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  BarChart3,
  Search,
  ClipboardList,
  CalendarDays,
  CreditCard,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";
import Logo from "../../assets/Logo/logo.png";
import { getOrders } from "../../lib/api";

const navItems = [
  { name: "ဒက်ရှ်ဘုတ်", path: "/overview", icon: <LayoutDashboard size={20} /> },
  { name: "ကုန်ပစ္စည်းစာရင်း", path: "/inventory", icon: <Package size={20} /> },
  { name: "ဖောက်သည်များ", path: "/customers", icon: <Users size={20} /> },
  { name: "ပို့ဆောင်မှုများ", path: "/deliveries", icon: <Truck size={20} /> },
  { name: "အော်ဒါများ", path: "/orders", icon: <ClipboardList size={20} /> },
  { name: "အစီရင်ခံစာများ", path: "/reports", icon: <BarChart3 size={20} /> },
];

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString("en-US")} MMK`;
}

function formatDateTime(value) {
  if (!value) return "-";

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

function formatStatusLabel(status) {
  const key = String(status || "").toLowerCase();
  const labels = {
    pending: "Point သို့ မအပ်ရသေး",
    confirmed: "Point သို့ မအပ်ရသေး",
    queued: "Point သို့ မအပ်ရသေး",
    shipped: "Point သို့ အပ်ပြီး",
    in_transit: "Point သို့ အပ်ပြီး",
    delivered: "Point မှ ပို့ဆောင်ပြီး",
    cancelled: "Cancelled",
    delayed: "Point နှောင့်နှေးနေသည်",
  };

  return labels[key] || "Pending";
}

function getStatusBadge(status) {
  const key = String(status || "").toLowerCase();
  if (key === "delivered") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (key === "shipped" || key === "in_transit") return "bg-blue-50 text-blue-700 border-blue-200";
  if (key === "confirmed" || key === "queued") return "bg-violet-50 text-violet-700 border-violet-200";
  if (key === "cancelled") return "bg-rose-50 text-rose-700 border-rose-200";
  if (key === "delayed") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

const OrderHandoff = () => {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadOrders() {
      setIsLoading(true);
      setError("");
      try {
        const response = await getOrders();
        const list = response?.data?.orders || [];
        if (!mounted) return;
        setOrders(list);
        setSelectedOrderId((prev) => prev || list[0]?.id || null);
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || "Unable to load orders.");
        setOrders([]);
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
    if (!query) return orders;

    return orders.filter((order) => {
      const itemNames = Array.isArray(order?.items)
        ? order.items.map((item) => item?.name || "").join(" ")
        : "";

      return (
        String(order?.id || "").toLowerCase().includes(query) ||
        String(order?.shipping?.fullName || "").toLowerCase().includes(query) ||
        String(order?.shipping?.phone || "").toLowerCase().includes(query) ||
        String(order?.shipping?.city || "").toLowerCase().includes(query) ||
        String(order?.shipping?.address || "").toLowerCase().includes(query) ||
        itemNames.toLowerCase().includes(query)
      );
    });
  }, [orders, searchQuery]);

  const selectedOrder =
    filteredOrders.find((order) => order.id === selectedOrderId) || filteredOrders[0] || null;

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
          <p className="text-sm text-slate-500">Delivery page ကနေခွဲထားပြီး order data ကို သီးသန့်ကြည့်နိုင်အောင် ပြထားပါတယ်။</p>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-[430px] overflow-y-auto border-r border-slate-100 bg-white">
            <div className="border-b border-slate-50 bg-slate-50/40 p-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/10"
                  placeholder="Search order, customer, phone, address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {isLoading && <p className="p-6 text-sm font-semibold text-slate-400">Loading orders...</p>}
            {!isLoading && error && <p className="p-6 text-sm font-semibold text-red-500">{error}</p>}
            {!isLoading && !error && filteredOrders.length === 0 && (
              <p className="p-6 text-sm font-semibold text-slate-400">No orders found.</p>
            )}

            {!isLoading &&
              !error &&
              filteredOrders.map((order) => {
                const isActive = selectedOrderId === order.id || (!selectedOrderId && filteredOrders[0]?.id === order.id);
                const itemCount = Array.isArray(order.items)
                  ? order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
                  : 0;

                return (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`w-full border-b border-slate-50 p-6 text-left transition-all ${
                      isActive ? "border-l-4 border-l-blue-600 bg-blue-50/60" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className={`rounded-lg px-3 py-1 text-xs font-black ${isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                        {order.id}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-black ${getStatusBadge(order.status)}`}>
                        {formatStatusLabel(order.status)}
                      </span>
                    </div>

                    <h3 className="mt-4 text-lg font-black text-slate-900">{order.shipping?.fullName || "Customer"}</h3>
                    <div className="mt-2 flex items-center justify-between gap-3 text-sm font-semibold text-slate-500">
                      <span>{itemCount} items</span>
                      <span>{formatCurrency(order.total)}</span>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-400">{formatDateTime(order.createdAt)}</p>
                  </button>
                );
              })}
          </div>

          <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)]">
            {selectedOrder ? (
              <div className="mx-auto max-w-6xl p-8">
                <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.25fr_0.85fr]">
                  <section className="rounded-[2rem] border border-blue-100 bg-white/90 p-8 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black tracking-widest text-slate-400">ORDER DETAIL</p>
                        <h2 className="mt-2 text-3xl font-black text-slate-900">{selectedOrder.id}</h2>
                        <p className="mt-2 text-sm text-slate-500">
                          This page is now separate from deliveries and only shows order information.
                        </p>
                      </div>
                      <span className={`rounded-full border px-4 py-2 text-xs font-black ${getStatusBadge(selectedOrder.status)}`}>
                        {formatStatusLabel(selectedOrder.status)}
                      </span>
                    </div>

                    <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
                      <DetailCard icon={<UserRound size={18} />} label="Customer" value={selectedOrder.shipping?.fullName || "-"} />
                      <DetailCard icon={<Phone size={18} />} label="Phone" value={selectedOrder.shipping?.phone || "-"} />
                      <DetailCard icon={<CalendarDays size={18} />} label="Order Date" value={formatDateTime(selectedOrder.createdAt)} />
                      <DetailCard icon={<CreditCard size={18} />} label="Payment" value={selectedOrder.paymentMethod || "-"} />
                      <DetailCard icon={<MapPin size={18} />} label="City" value={selectedOrder.shipping?.city || "-"} />
                      <DetailCard icon={<MapPin size={18} />} label="Address" value={selectedOrder.shipping?.address || "-"} />
                    </div>

                    <div className="mt-8 rounded-[1.75rem] border border-slate-100 bg-slate-50 p-6">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-lg font-black text-slate-900">Order Items</h3>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">
                          {selectedOrder.items?.length || 0} products
                        </span>
                      </div>

                      <div className="mt-5 space-y-3">
                        {(selectedOrder.items || []).map((item, index) => (
                          <div key={`${selectedOrder.id}-${item.id}-${index}`} className="rounded-2xl border border-white bg-white px-4 py-4 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-base font-black text-slate-900">{item.name}</p>
                                <p className="mt-1 text-xs font-semibold text-slate-500">
                                  Qty {item.quantity} x {formatCurrency(item.unitPrice)}
                                </p>
                              </div>
                              <p className="text-sm font-black text-slate-900">{formatCurrency(item.totalPrice)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                    <p className="text-xs font-black tracking-widest text-slate-400">PAYMENT SUMMARY</p>
                    <h3 className="mt-2 text-2xl font-black text-slate-900">Order Total</h3>

                    <div className="mt-6 space-y-4 rounded-[1.5rem] bg-slate-50 p-5">
                      <SummaryRow label="Subtotal" value={formatCurrency(selectedOrder.subtotal)} />
                      <SummaryRow label="Tax" value={formatCurrency(selectedOrder.tax)} />
                      <SummaryRow label="Total" value={formatCurrency(selectedOrder.total)} total />
                    </div>

                    <div className="mt-6 rounded-[1.5rem] border border-slate-100 bg-blue-50/70 p-5">
                      <p className="text-xs font-black tracking-widest text-blue-500">CUSTOMER CONTACT</p>
                      <p className="mt-3 text-sm font-black text-slate-900">{selectedOrder.shipping?.email || "-"}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-500">{selectedOrder.shipping?.phone || "-"}</p>
                    </div>
                  </aside>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center font-semibold text-slate-400">
                Select an order to view the details.
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
    <p className="mt-3 break-words text-base font-black text-slate-900">{value}</p>
  </div>
);

const SummaryRow = ({ label, value, total = false }) => (
  <div className={`flex items-center justify-between gap-3 ${total ? "border-t border-slate-200 pt-4" : ""}`}>
    <span className={`text-sm ${total ? "font-black text-slate-900" : "font-semibold text-slate-500"}`}>{label}</span>
    <span className={`text-sm ${total ? "font-black text-slate-900" : "font-bold text-slate-700"}`}>{value}</span>
  </div>
);

export default OrderHandoff;
