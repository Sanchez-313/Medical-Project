import React, { useState } from "react";
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
  Download,
  Pill,
  Leaf,
  Edit,
  Delete,
  Layers,
  AlertCircle,
  AlertTriangle,
  Banknote,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import Logo from "../../assets/Logo/logo.png";

const InventoryDashboard = () => {
  const location = useLocation();

  // 1. STATE MANAGEMENT
  const [activeTab, setActiveTab] = useState("English Medicine");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 2. MOCK DATA (Localized for Myanmar)
  const fullInventory = [
    {
      id: 1,
      name: "Biogesic (Paracetamol)",
      sub: "Tablet • 500mg • 100s",
      sku: "MM-BIO-001",
      cat: "General",
      stock: 1250,
      total: 2000,
      price: 8500,
      status: "normal",
    },
    {
      id: 2,
      name: "BPI Amoxicillin",
      sub: "Capsule • 500mg • 10x10",
      sku: "MM-BPI-042",
      cat: "Antibiotics",
      stock: 15,
      total: 200,
      price: 12000,
      status: "low",
    },
    {
      id: 3,
      name: "Decolgen Forte",
      sub: "Tablet • Strip of 4",
      sku: "MM-DEC-089",
      cat: "Cold & Flu",
      stock: 450,
      total: 500,
      price: 1500,
      status: "normal",
    },
    {
      id: 4,
      name: "တိုင်းရင်းဆေး အမှတ် (၁)",
      sub: "Bottle • 120ml",
      sku: "MM-TRD-221",
      cat: "Traditional",
      stock: 230,
      total: 230,
      price: 4500,
      status: "normal",
    },
    {
      id: 5,
      name: "Burmeton",
      sub: "Tablet • 100s",
      sku: "MM-BPI-992",
      cat: "General",
      stock: 0,
      total: 100,
      price: 3200,
      status: "expired",
    },
    {
      id: 6,
      name: "C-Vit (BPI)",
      sub: "Tablet • Vitamin C",
      sku: "MM-BPI-111",
      cat: "Supplements",
      stock: 500,
      total: 1000,
      price: 5000,
      status: "normal",
    },
    {
      id: 7,
      name: "Para-Citamon",
      sub: "Tablet • 500mg",
      sku: "MM-GEN-009",
      cat: "General",
      stock: 80,
      total: 1000,
      price: 2500,
      status: "low",
    },
    // Add more items here to test pagination...
  ];

  // 3. PAGINATION LOGIC
  const totalPages = Math.ceil(fullInventory.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = fullInventory.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const formatKyat = (val) =>
    new Intl.NumberFormat("en-MM").format(val) + " Ks";

  const navItems = [
    {
      name: "Dashboard",
      path: "/overview",
      icon: <LayoutDashboard size={20} />,
    },
    {
      name: "ဆေးဝါးစာရင်း",
      path: "/inventory",
      icon: <Package size={20} />,
    },
    { name: "ဖောက်သည်များ", path: "/customers", icon: <Users size={20} /> },
    { name: "ပို့ဆောင်ရေး", path: "/deliveries", icon: <Truck size={20} /> },
    { name: "အစီရင်ခံစာ", path: "/reports", icon: <BarChart3 size={20} /> },
  ];

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans text-slate-900">
      {/* SIDE NAVIGATION */}
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

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8">
        <header className="flex items-center justify-between mb-10">
          <div className="relative w-96">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/10"
              placeholder="ဆေးအမည်ဖြင့် ရှာဖွေရန်..."
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-md shadow-blue-100">
              <Plus size={18} /> ဆေးအသစ်ထည့်ရန်
            </button>
          </div>
        </header>

        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">
              ဆေးဝါးစာရင်း စီမံခန့်ခွဲမှု
            </h2>
            <p className="text-slate-500 font-medium pt-4">
              မြန်မာနိုင်ငံရှိ သိုလှောင်ရုံများအတွက် လက်ကျန်စစ်ဆေးခြင်း
            </p>
          </div>
          <button className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm">
            <Download size={16} /> စာရင်းထုတ်ရန်
          </button>
        </div>

        {/* INVENTORY TABLE CARD */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden mb-8">
          <div className="flex border-b border-slate-100 px-8">
            {["English Medicine", "Myanmar Traditional", "BPI Products"].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setCurrentPage(1);
                  }}
                  className={`pb-4 pt-6 px-6 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
                    activeTab === tab
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {tab}
                </button>
              ),
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] border-b border-slate-50">
                  <th className="px-8 py-5">Item Details</th>
                  <th className="px-6 py-5">SKU</th>
                  <th className="px-6 py-5">Category</th>
                  <th className="px-6 py-5">Stock</th>
                  <th className="px-6 py-5">Price (Ks)</th>
                  <th className="px-6 py-5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {currentItems.map((item) => (
                  <tr
                    key={item.id}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div
                          className={`size-10 rounded-xl flex items-center justify-center ${item.cat === "Traditional" ? "bg-emerald-50 text-emerald-500" : "bg-blue-50 text-blue-500"}`}
                        >
                          {item.cat === "Traditional" ? (
                            <Leaf size={20} />
                          ) : (
                            <Pill size={20} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">
                            {item.name}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            {item.sub}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-xs font-bold text-slate-500">
                      {item.sku}
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 rounded-lg text-[10px] font-black bg-slate-100 text-slate-600 uppercase">
                        {item.cat}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.status === "low" ? "bg-red-500" : "bg-emerald-500"}`}
                            style={{
                              width: `${(item.stock / item.total) * 100}%`,
                            }}
                          />
                        </div>
                        <p
                          className={`text-[10px] font-black ${item.status === "low" ? "text-red-500" : "text-slate-500"}`}
                        >
                          {item.stock} ခု
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-black text-slate-900">
                      {formatKyat(item.price)}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                          <Edit size={16} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                          <Delete size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 4. PAGINATION FOOTER */}
          <div className="px-8 py-5 border-t border-slate-50 flex items-center justify-between bg-slate-50/20">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Showing {indexOfFirstItem + 1} to{" "}
              {Math.min(indexOfLastItem, fullInventory.length)} of{" "}
              {fullInventory.inventory} entries
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg border border-slate-200 transition-all ${currentPage === 1 ? "opacity-20 cursor-not-allowed" : "hover:bg-white hover:text-blue-600 shadow-sm"}`}
              >
                <ChevronLeft size={16} />
              </button>

              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
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
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg border border-slate-200 transition-all ${currentPage === totalPages ? "opacity-20 cursor-not-allowed" : "hover:bg-white hover:text-blue-600 shadow-sm"}`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-4 gap-6">
          {[
            {
              label: "ဆေးအမျိုးအစားပေါင်း",
              val: fullInventory.length,
              icon: <Layers className="text-blue-500" />,
              color: "bg-blue-50",
            },
            {
              label: "လက်ကျန်မရှိတော့သည်များ",
              val: "၂",
              icon: <AlertCircle className="text-red-500" />,
              color: "bg-red-50",
            },
            {
              label: "လက်ကျန်နည်းနေသည်များ",
              val: "၁",
              icon: <AlertTriangle className="text-orange-500" />,
              color: "bg-orange-50",
            },
            {
              label: "စုစုပေါင်းတန်ဖိုး (Ks)",
              val: "၃၆,၇၀၀ Ks",
              icon: <Banknote className="text-emerald-500" />,
              color: "bg-emerald-500/10",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5"
            >
              <div
                className={`size-14 rounded-2xl ${stat.color} flex items-center justify-center shrink-0`}
              >
                {stat.icon}
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {stat.label}
                </p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter">
                  {stat.val}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default InventoryDashboard;
