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
  Download,
  Pill,
  Leaf,
  Layers,
  PackagePlus,
  AlertCircle,
  AlertTriangle,
  Banknote,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Logo from "../../assets/Logo/logo.png";
import { getInventory } from "../../lib/api";

const TAB_TO_CATEGORY = {
  "All Items": "",
  "English Medicine": "EnglishMedicine",
  "Myanmar Medicine": "MyanmarMedicine",
  Equipment: "Equipment",
};

const TAB_LABELS_MM = {
  "All Items": "ကုန်ပစ္စည်းအားလုံး",
  "English Medicine": "အင်္ဂလိပ်ဆေးဝါး",
  "Myanmar Medicine": "မြန်မာတိုင်းရင်းဆေး",
  Equipment: "ဆေးပစ္စည်းကိရိယာများ",
};

const CATEGORY_LABELS_MM = {
  EnglishMedicine: "အင်္ဂလိပ်ဆေးဝါး",
  MyanmarMedicine: "မြန်မာတိုင်းရင်းဆေး",
  Equipment: "ဆေးပစ္စည်းကိရိယာများ",
};

const navItems = [
  { name: "ဒက်ရှ်ဘုတ်", path: "/overview", icon: <LayoutDashboard size={20} /> },
  { name: "ကုန်ပစ္စည်းစာရင်း", path: "/inventory", icon: <Package size={20} /> },
  { name: "Restock", path: "/restock", icon: <PackagePlus size={20} /> },
  { name: "ဖောက်သည်များ", path: "/customers", icon: <Users size={20} /> },
  { name: "ပို့ဆောင်မှုများ", path: "/deliveries", icon: <Truck size={20} /> },
  { name: "အော်ဒါများ", path: "/orders", icon: <ClipboardList size={20} /> },
  { name: "အစီရင်ခံစာများ", path: "/reports", icon: <BarChart3 size={20} /> },
];

const LOW_STOCK_THRESHOLD = 50;

const InventoryDashboard = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("All Items");
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    let isMounted = true;

    async function loadInventory() {
      setIsLoading(true);
      setError("");
      try {
        const response = await getInventory({
          search: searchQuery,
          category: TAB_TO_CATEGORY[activeTab] || "",
        });
        if (!isMounted) return;
        setItems(response?.data?.items || []);
        setCurrentPage(1);
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || "ကုန်ပစ္စည်းစာရင်းကို မရယူနိုင်ပါ။");
        setItems([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInventory();
    return () => {
      isMounted = false;
    };
  }, [activeTab, searchQuery]);

  const sortedItems = useMemo(
    () =>
      [...items].sort(
        (a, b) => Number(a.stock || 0) - Number(b.stock || 0) || Number(a.id || 0) - Number(b.id || 0),
      ),
    [items],
  );

  const lowStockItems = useMemo(
    () => sortedItems.filter((item) => Number(item.stock || 0) < LOW_STOCK_THRESHOLD),
    [sortedItems],
  );

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedItems.slice(indexOfFirstItem, indexOfLastItem);

  const stats = useMemo(() => {
    const lowStockCount = sortedItems.filter((item) => Number(item.stock || 0) < LOW_STOCK_THRESHOLD).length;
    const outOfStockCount = sortedItems.filter((item) => Number(item.stock || 0) === 0).length;
    const totalValue = sortedItems.reduce(
      (acc, item) => acc + Number(item.price_ks || 0) * Number(item.stock || 0),
      0,
    );

    return {
      totalItems: sortedItems.length,
      lowStockCount,
      outOfStockCount,
      totalValue,
    };
  }, [sortedItems]);

  const formatKyat = (val) => `${new Intl.NumberFormat("en-MM").format(Number(val || 0))} Ks`;

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-['Pyidaungsu','Noto_Sans_Myanmar','Myanmar_Text',sans-serif] text-slate-900">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex h-full flex-col p-6">
          <div className="group mb-10 flex items-center gap-2">
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
                  {item.icon} {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <header className="mb-10 flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/10"
              placeholder="ဆေးအမည် သို့မဟုတ် SKU ဖြင့် ရှာဖွေရန်..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50">
            <Download size={16} /> ထုတ်ယူရန်
          </button>
        </header>

        <div className="mb-8 overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
          <div className="flex border-b border-slate-100 px-8">
            {Object.keys(TAB_TO_CATEGORY).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-6 pb-4 pt-6 text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {TAB_LABELS_MM[tab] || tab}
              </button>
            ))}
          </div>

          {lowStockItems.length > 0 ? (
            <div className="mx-8 mt-6 rounded-3xl border border-red-200 bg-red-50 px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-2xl bg-white p-2 text-red-500 shadow-sm">
                  <AlertTriangle size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-red-700">
                    Low stock alert: {lowStockItems.length} item(s) below {LOW_STOCK_THRESHOLD}
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-6 text-red-600">
                    {lowStockItems
                      .slice(0, 6)
                      .map((item) => `${item.name} (${item.stock})`)
                      .join(" • ")}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="min-h-[420px] overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                  <th className="px-8 py-5">ပစ္စည်းအသေးစိတ်</th>
                  <th className="px-6 py-5">SKU</th>
                  <th className="px-6 py-5">အမျိုးအစား</th>
                  <th className="px-6 py-5">စတော့</th>
                  <th className="px-6 py-5">ဈေးနှုန်း (Ks)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center font-bold text-slate-400">
                      ကုန်ပစ္စည်းစာရင်းကို ရယူနေသည်...
                    </td>
                  </tr>
                ) : null}

                {!isLoading && error ? (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center font-bold text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : null}

                {!isLoading && !error && currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center font-bold text-slate-400">
                      ကုန်ပစ္စည်းမတွေ့ပါ။
                    </td>
                  </tr>
                ) : null}

                {!isLoading &&
                  !error &&
                  currentItems.map((item) => {
                    const stock = Number(item.stock || 0);
                    const totalStock = Number(item.total_stock || 0);
                    const categoryKey = String(item.category || "");
                    const isMyanmarMedicine = categoryKey === "MyanmarMedicine";
                    const isEquipment = categoryKey === "Equipment";
                    const ratio = totalStock > 0 ? Math.min(100, (stock / totalStock) * 100) : 0;
                    const lowStock = stock < LOW_STOCK_THRESHOLD;

                    return (
                      <tr key={item.id} className="group transition-colors hover:bg-slate-50/50">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div
                              className={`flex size-10 items-center justify-center rounded-xl ${
                                isEquipment
                                  ? "bg-amber-50 text-amber-600"
                                  : isMyanmarMedicine
                                    ? "bg-emerald-50 text-emerald-500"
                                    : "bg-blue-50 text-blue-500"
                              }`}
                            >
                              {isEquipment ? <PackagePlus size={20} /> : isMyanmarMedicine ? <Leaf size={20} /> : <Pill size={20} />}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-800">{item.name}</p>
                              <p className="text-[10px] font-bold uppercase text-slate-400">ID #{item.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-xs font-bold text-slate-500">{item.sku}</td>
                        <td className="px-6 py-5">
                          <span
                            className={`rounded-lg px-3 py-1 text-[10px] font-black uppercase ${
                              isEquipment
                                ? "bg-amber-100 text-amber-700"
                                : isMyanmarMedicine
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {CATEGORY_LABELS_MM[categoryKey] || item.category}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full ${lowStock ? "bg-red-500" : "bg-emerald-500"}`}
                                style={{ width: `${ratio}%` }}
                              />
                            </div>
                            <p className={`text-[10px] font-black ${lowStock ? "text-red-500" : "text-slate-500"}`}>
                              {stock}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-sm font-black text-slate-900">{formatKyat(item.price_ks)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-50 bg-slate-50/20 px-8 py-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              စုစုပေါင်း {sortedItems.length} ခုအနက် {sortedItems.length === 0 ? 0 : indexOfFirstItem + 1} မှ{" "}
              {Math.min(indexOfLastItem, sortedItems.length)} အထိ ပြထားသည်
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`rounded-lg border border-slate-200 p-2 transition-all ${
                  currentPage === 1 ? "cursor-not-allowed opacity-20" : "shadow-sm hover:bg-white hover:text-blue-600"
                }`}
              >
                <ChevronLeft size={16} />
              </button>

              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-9 min-w-[36px] rounded-lg border text-xs font-black transition-all ${
                      currentPage === pageNum
                        ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-100"
                        : "border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:text-blue-600"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`rounded-lg border border-slate-200 p-2 transition-all ${
                  currentPage === totalPages
                    ? "cursor-not-allowed opacity-20"
                    : "shadow-sm hover:bg-white hover:text-blue-600"
                }`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {[
            {
              label: "စုစုပေါင်းပစ္စည်း",
              val: stats.totalItems,
              icon: <Layers className="text-blue-500" />,
              color: "bg-blue-50",
            },
            {
              label: "စတော့ကုန်",
              val: stats.outOfStockCount,
              icon: <AlertCircle className="text-red-500" />,
              color: "bg-red-50",
            },
            {
              label: `စတော့နည်း (< ${LOW_STOCK_THRESHOLD})`,
              val: stats.lowStockCount,
              icon: <AlertTriangle className="text-orange-500" />,
              color: "bg-orange-50",
            },
            {
              label: "စတော့တန်ဖိုး (Ks)",
              val: formatKyat(stats.totalValue),
              icon: <Banknote className="text-emerald-500" />,
              color: "bg-emerald-500/10",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-5 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm"
            >
              <div className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                <p className="text-2xl font-black tracking-tighter text-slate-900">{stat.val}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default InventoryDashboard;
