import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  BarChart3,
  ClipboardList,
  PackagePlus,
  Search,
  AlertTriangle,
  RefreshCw,
  Save,
} from "lucide-react";
import Logo from "../../assets/Logo/logo.png";
import { getInventory, updateInventoryItem } from "../../lib/api";

const LOW_STOCK_THRESHOLD = 50;

const navItems = [
  {
    name: "ဒက်ရှ်ဘုတ်",
    path: "/overview",
    icon: <LayoutDashboard size={20} />,
  },
  {
    name: "ကုန်ပစ္စည်းစာရင်း",
    path: "/inventory",
    icon: <Package size={20} />,
  },
  { name: "Restock", path: "/restock", icon: <PackagePlus size={20} /> },
  { name: "ဖောက်သည်များ", path: "/customers", icon: <Users size={20} /> },
  { name: "ပို့ဆောင်မှုများ", path: "/deliveries", icon: <Truck size={20} /> },
  { name: "အော်ဒါများ", path: "/orders", icon: <ClipboardList size={20} /> },
  { name: "အစီရင်ခံစာများ", path: "/reports", icon: <BarChart3 size={20} /> },
];

function getNextStatus(stock) {
  if (stock <= 0) return "expired";
  if (stock < 25) return "low";
  return "normal";
}

const LowStockRefill = () => {
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const loadItems = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await getInventory({ search: searchQuery });
      setItems(response?.data?.items || []);
    } catch (err) {
      setError(err?.message || "Could not load low-stock items.");
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [searchQuery]);

  const lowStockItems = useMemo(
    () =>
      items
        .filter((item) => Number(item.stock || 0) < LOW_STOCK_THRESHOLD)
        .sort(
          (a, b) =>
            Number(a.stock || 0) - Number(b.stock || 0) ||
            Number(a.id || 0) - Number(b.id || 0),
        ),
    [items],
  );

  const totalRefillNeeded = useMemo(
    () =>
      lowStockItems.reduce(
        (sum, item) =>
          sum + Math.max(0, LOW_STOCK_THRESHOLD - Number(item.stock || 0)),
        0,
      ),
    [lowStockItems],
  );

  const handleDraftChange = (id, value) => {
    setDrafts((prev) => ({
      ...prev,
      [String(id)]: Math.max(0, Number(value) || 0),
    }));
  };

  const handleRefill = async (item) => {
    const refillQty = Math.max(0, Number(drafts[String(item.id)] || 0));
    if (refillQty <= 0) {
      setError("Please enter a refill quantity greater than 0.");
      return;
    }

    const currentStock = Number(item.stock || 0);
    const nextStock = currentStock + refillQty;

    try {
      setSavingId(item.id);
      setError("");
      setSuccessMessage("");
      await updateInventoryItem(item.id, {
        stock: nextStock,
        price_ks: Number(item.price_ks || 0),
        status: getNextStatus(nextStock),
      });

      setItems((prev) =>
        prev.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                stock: nextStock,
                status: getNextStatus(nextStock),
              }
            : entry,
        ),
      );
      setDrafts((prev) => ({ ...prev, [String(item.id)]: 0 }));
      setSuccessMessage(`${item.name} stock updated to ${nextStock}.`);
    } catch (err) {
      setError(err?.message || "Could not update stock.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-['Pyidaungsu','Noto_Sans_Myanmar','Myanmar_Text',sans-serif] text-slate-900">
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col sticky top-0 h-screen shrink-0">
        <div className="flex h-full flex-col p-6">
          <div className="mb-10 flex items-center gap-2 group">
            <img src={Logo} alt="Logo" className="h-10 w-10 object-contain" />
            <span className="text-xl font-bold uppercase italic tracking-tighter text-indigo-400">
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
        <header className="mb-8 flex items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              Low Stock Refill
            </h1>
            <p className="pt-3 text-slate-500">
              Refill products below {LOW_STOCK_THRESHOLD} stock and update them
              directly from here.
            </p>
          </div>
          <button
            type="button"
            onClick={loadItems}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </header>

        <div className="mb-6 grid grid-cols-3 gap-6">
          <SummaryCard
            label="Low Stock Items"
            value={lowStockItems.length}
            tone="red"
          />
          <SummaryCard
            label="Minimum Units Needed"
            value={totalRefillNeeded}
            tone="amber"
          />
          <SummaryCard
            label="Threshold"
            value={LOW_STOCK_THRESHOLD}
            tone="blue"
          />
        </div>

        <div className="mb-6 flex items-center gap-4">
          <div className="relative w-full max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/10"
              placeholder="Search low-stock medicine or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <div className="flex items-center gap-2 text-sm font-black text-red-600">
              <AlertTriangle size={18} />
              Items below {LOW_STOCK_THRESHOLD} stock
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                  <th className="px-6 py-4">Product</th>
                  <th className="px-4 py-4">Category</th>
                  <th className="px-4 py-4">Current Stock</th>
                  <th className="px-4 py-4">Refill Qty</th>
                  <th className="px-4 py-4">New Stock</th>
                  <th className="px-4 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-16 text-center text-sm font-semibold text-slate-400"
                    >
                      Loading low-stock items...
                    </td>
                  </tr>
                ) : null}
                {!isLoading && lowStockItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-16 text-center text-sm font-semibold text-slate-400"
                    >
                      No low-stock items found.
                    </td>
                  </tr>
                ) : null}
                {!isLoading &&
                  lowStockItems.map((item) => {
                    const currentStock = Number(item.stock || 0);
                    const refillQty = Math.max(
                      0,
                      Number(drafts[String(item.id)] || 0),
                    );
                    const nextStock = currentStock + refillQty;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-black text-slate-800">
                              {item.name}
                            </p>
                            <p className="text-[11px] font-semibold text-slate-400">
                              {item.sku}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs font-bold text-slate-600">
                          {item.category}
                        </td>
                        <td className="px-4 py-4">
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
                            {currentStock}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <input
                            type="number"
                            min="0"
                            value={drafts[String(item.id)] ?? ""}
                            onChange={(e) =>
                              handleDraftChange(item.id, e.target.value)
                            }
                            className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/10"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-4 py-4 text-sm font-black text-slate-800">
                          {nextStock}
                        </td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => handleRefill(item)}
                            disabled={savingId === item.id}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Save size={14} />
                            {savingId === item.id
                              ? "Saving..."
                              : "Apply Refill"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

const SummaryCard = ({ label, value, tone }) => {
  const toneMap = {
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
  };

  return (
    <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
      <div
        className={`inline-flex rounded-xl px-3 py-1 text-xs font-black ${toneMap[tone] || toneMap.blue}`}
      >
        {label}
      </div>
      <p className="mt-4 text-3xl font-black tracking-tighter text-slate-900">
        {value}
      </p>
    </div>
  );
};

export default LowStockRefill;
