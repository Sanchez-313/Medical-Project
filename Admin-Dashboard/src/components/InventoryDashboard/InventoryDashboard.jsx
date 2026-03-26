import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  BarChart3,
  Search,
  Download,
  Pill,
  Leaf,
  Layers,
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
  "English Medicine": "English Medicine",
  "Myanmar Traditional": "Myanmar Traditional",
  "BPI Products": "BPI Products",
};

const TAB_LABELS_MM = {
  "All Items": "ကုန်ပစ္စည်းအားလုံး",
  "English Medicine": "အင်္ဂလိပ်ဆေးဝါး",
  "Myanmar Traditional": "မြန်မာတိုင်းရင်းဆေး",
  "BPI Products": "BPI ထုတ်ကုန်",
};

const navItems = [
  { name: "ဒက်ရှ်ဘုတ်", path: "/overview", icon: <LayoutDashboard size={20} /> },
  { name: "ကုန်ပစ္စည်းစာရင်း", path: "/inventory", icon: <Package size={20} /> },
  { name: "ဖောက်သည်များ", path: "/customers", icon: <Users size={20} /> },
  { name: "ပို့ဆောင်မှုများ", path: "/deliveries", icon: <Truck size={20} /> },
  { name: "အစီရင်ခံစာများ", path: "/reports", icon: <BarChart3 size={20} /> },
];

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

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);

  const stats = useMemo(() => {
    const lowStockCount = items.filter((item) => Number(item.stock) <= 10).length;
    const outOfStockCount = items.filter((item) => Number(item.stock) === 0).length;
    const totalValue = items.reduce(
      (acc, item) => acc + Number(item.price_ks || 0) * Number(item.stock || 0),
      0,
    );

    return {
      totalItems: items.length,
      lowStockCount,
      outOfStockCount,
      totalValue,
    };
  }, [items]);

  const formatKyat = (val) => `${new Intl.NumberFormat("en-MM").format(Number(val || 0))} Ks`;

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-['Pyidaungsu','Noto_Sans_Myanmar','Myanmar_Text',sans-serif] text-slate-900">
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col sticky top-0 h-screen shrink-0">
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-10 group">
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
        <header className="flex items-center justify-between mb-10">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/10"
              placeholder="ဆေးအမည် သို့မဟုတ် SKU ဖြင့် ရှာဖွေရန်..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm">
            <Download size={16} /> ထုတ်ယူရန်
          </button>
        </header>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden mb-8">
          <div className="flex border-b border-slate-100 px-8">
            {Object.keys(TAB_TO_CATEGORY).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 pt-6 px-6 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {TAB_LABELS_MM[tab] || tab}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto min-h-[420px]">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] border-b border-slate-50">
                  <th className="px-8 py-5">ပစ္စည်းအသေးစိတ်</th>
                  <th className="px-6 py-5">SKU</th>
                  <th className="px-6 py-5">အမျိုးအစား</th>
                  <th className="px-6 py-5">စတော့</th>
                  <th className="px-6 py-5">ဈေးနှုန်း (Ks)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading && (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center text-slate-400 font-bold">
                      ကုန်ပစ္စည်းစာရင်းကို ရယူနေသည်...
                    </td>
                  </tr>
                )}

                {!isLoading && error && (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center text-red-500 font-bold">
                      {error}
                    </td>
                  </tr>
                )}

                {!isLoading && !error && currentItems.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center text-slate-400 font-bold">
                      ကုန်ပစ္စည်းမတွေ့ပါ။
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  !error &&
                  currentItems.map((item) => {
                    const stock = Number(item.stock || 0);
                    const totalStock = Number(item.total_stock || 0);
                    const isTraditional = String(item.category || "").toLowerCase().includes("traditional");
                    const ratio = totalStock > 0 ? Math.min(100, (stock / totalStock) * 100) : 0;
                    const lowStock = stock <= 10;

                    return (
                      <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div
                              className={`size-10 rounded-xl flex items-center justify-center ${
                                isTraditional ? "bg-emerald-50 text-emerald-500" : "bg-blue-50 text-blue-500"
                              }`}
                            >
                              {isTraditional ? <Leaf size={20} /> : <Pill size={20} />}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-800">{item.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">ID #{item.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-xs font-bold text-slate-500">{item.sku}</td>
                        <td className="px-6 py-5">
                          <span className="px-3 py-1 rounded-lg text-[10px] font-black bg-slate-100 text-slate-600 uppercase">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
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
                        <td className="px-6 py-5 text-sm font-black text-slate-900">
                          {formatKyat(item.price_ks)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="px-8 py-5 border-t border-slate-50 flex items-center justify-between bg-slate-50/20">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              စုစုပေါင်း {items.length} ခုအနက် {items.length === 0 ? 0 : indexOfFirstItem + 1} မှ{" "}
              {Math.min(indexOfLastItem, items.length)} အထိ ပြထားသည်
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg border border-slate-200 transition-all ${
                  currentPage === 1 ? "opacity-20 cursor-not-allowed" : "hover:bg-white hover:text-blue-600 shadow-sm"
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
                    className={`min-w-[36px] h-9 rounded-lg text-xs font-black transition-all border ${
                      currentPage === pageNum
                        ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100"
                        : "bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg border border-slate-200 transition-all ${
                  currentPage === totalPages
                    ? "opacity-20 cursor-not-allowed"
                    : "hover:bg-white hover:text-blue-600 shadow-sm"
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
              label: "SKU စုစုပေါင်း",
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
              label: "စတော့နည်း",
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
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5"
            >
              <div className={`size-14 rounded-2xl ${stat.color} flex items-center justify-center shrink-0`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter">{stat.val}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default InventoryDashboard;
