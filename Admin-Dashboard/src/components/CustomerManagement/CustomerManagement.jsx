import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Users,
  UserCheck,
  Search,
  Plus,
  LayoutDashboard,
  Package,
  Truck,
  BarChart3,
  ClipboardList,
  ShieldCheck,
  Activity,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import Logo from "../../assets/Logo/logo.png";
import { createCustomer, getCustomers } from "../../lib/api";

const navItems = [
  { name: "ဒက်ရှ်ဘုတ်", path: "/overview", icon: <LayoutDashboard size={20} /> },
  { name: "ကုန်ပစ္စည်းစာရင်း", path: "/inventory", icon: <Package size={20} /> },
  { name: "ဖောက်သည်များ", path: "/customers", icon: <Users size={20} /> },
  { name: "ပို့ဆောင်မှုများ", path: "/deliveries", icon: <Truck size={20} /> },
  { name: "အော်ဒါများ", path: "/orders", icon: <ClipboardList size={20} /> },
  { name: "အစီရင်ခံစာများ", path: "/reports", icon: <BarChart3 size={20} /> },
];

const AddUserModal = ({ isOpen, onClose, activeTab, onAddUser, isSaving }) => {
  const getDefaultRole = (tab) => (tab === "staff" ? "Inventory Manager" : "Standard Customer");
  const [formData, setFormData] = useState({ name: "", email: "", role: getDefaultRole(activeTab) });

  useEffect(() => {
    setFormData({ name: "", email: "", role: getDefaultRole(activeTab) });
  }, [activeTab, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onAddUser(formData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {activeTab === "staff" ? "ဝန်ထမ်းအသစ်ထည့်ရန်" : "ဖောက်သည်အသစ်ထည့်ရန်"}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
              <X size={24} />
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">အမည်အပြည့်အစုံ</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="ဥပမာ - မောင်မောင်"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">အခန်းကဏ္ဍ</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm outline-none appearance-none"
                >
                  {activeTab === "staff" ? (
                    <>
                      <option value="Inventory Manager">ကုန်ပစ္စည်းမန်နေဂျာ</option>
                      <option value="Logistics Lead">ပို့ဆောင်ရေးခေါင်းဆောင်</option>
                      <option value="Super Admin">စူပါအက်မင်</option>
                    </>
                  ) : (
                    <>
                      <option value="Standard Customer">ပုံမှန်ဖောက်သည်</option>
                      <option value="Premium Customer">အထူးဖောက်သည်</option>
                      <option value="Wholesale Partner">လက်ကားပူးပေါင်းသူ</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">အီးမေးလ်လိပ်စာ</label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="name@example.com"
              />
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3.5 rounded-2xl text-sm font-black text-slate-500 hover:bg-slate-50 transition-all"
              >
                မလုပ်တော့ပါ
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-blue-600 px-6 py-3.5 rounded-2xl text-sm font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {isSaving ? "သိမ်းဆည်းနေသည်..." : "မှတ်ပုံတင်အတည်ပြုရန်"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const CustomerManagement = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("customers");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [userList, setUserList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const itemsPerPage = 5;

  async function loadUsers() {
    setIsLoading(true);
    setError("");
    try {
      const response = await getCustomers({ type: activeTab, search: searchQuery });
      setUserList(response?.data?.customers || []);
      setCurrentPage(1);
    } catch (err) {
      setError(err.message || "ဖောက်သည်များကို မရယူနိုင်ပါ။");
      setUserList([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [activeTab, searchQuery]);

  const filteredUsers = useMemo(() => userList, [userList]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const handleAddUser = async (formData) => {
    setIsSaving(true);
    setError("");
    try {
      await createCustomer({
        name: formData.name,
        email: formData.email,
        type: activeTab,
        roleLabel: formData.role,
      });
      setIsModalOpen(false);
      await loadUsers();
    } catch (err) {
      setError(err.message || "အသုံးပြုသူအသစ် မဖန်တီးနိုင်ပါ။");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-['Pyidaungsu','Noto_Sans_Myanmar','Myanmar_Text',sans-serif] text-slate-900">
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col sticky top-0 h-screen shrink-0">
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-10">
            <img src={Logo} alt="Logo" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold tracking-tighter text-indigo-400 uppercase italic">AzureMed hub</span>
          </div>
          <nav className="flex flex-col gap-2 flex-grow">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                  location.pathname === item.path
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {item.icon} {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <header className="flex items-center justify-between mb-10">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/10"
              placeholder="အမည်၊ ကုဒ်၊ အီးမေးလ်ဖြင့် ရှာဖွေရန်..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-md"
          >
            <Plus size={18} /> အသုံးပြုသူအသစ်ထည့်ရန်
          </button>
        </header>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold">
            {error}
          </div>
        )}

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden mb-8">
          <div className="flex border-b border-slate-100 px-8">
            {["customers", "staff"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 pt-6 px-6 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab === "customers" ? "မှတ်ပုံတင်ပြီး ဖောက်သည်များ" : "ဝန်ထမ်းအသုံးပြုသူများ"}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
                  <th className="px-8 py-5">အသုံးပြုသူအသေးစိတ်</th>
                  <th className="px-6 py-5">အခန်းကဏ္ဍ</th>
                  <th className="px-6 py-5">ဆက်သွယ်ရန်</th>
                  <th className="px-6 py-5">လှုပ်ရှားမှု</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading && (
                  <tr>
                    <td colSpan="4" className="px-8 py-20 text-center text-slate-400 font-bold">
                      အသုံးပြုသူများကို ရယူနေသည်...
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  currentItems.map((user) => {
                    const initials = String(user.name || "")
                      .split(" ")
                      .filter(Boolean)
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();
                    const isStaff = user.type === "staff";
                    return (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div
                              className={`size-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${
                                isStaff ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
                              }`}
                            >
                              {initials || "??"}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-800">{user.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">{user.code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                              isStaff ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
                            }`}
                          >
                            {user.role_label}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-xs font-bold text-slate-500">{user.email}</td>
                        <td className="px-6 py-5 text-xs font-bold text-slate-500">{user.last_activity || "-"}</td>
                      </tr>
                    );
                  })}
                {!isLoading && currentItems.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-8 py-20 text-center text-slate-400 font-bold">
                      အသုံးပြုသူမတွေ့ပါ။
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-8 py-5 border-t border-slate-50 flex items-center justify-between bg-slate-50/20">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              စုစုပေါင်း {filteredUsers.length} ခုအနက် {filteredUsers.length > 0 ? indexOfFirstItem + 1 : 0} မှ{" "}
              {Math.min(indexOfLastItem, filteredUsers.length)} အထိ ပြထားသည်
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
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`min-w-[36px] h-9 rounded-lg text-xs font-black border ${
                    currentPage === i + 1
                      ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100"
                      : "bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
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

        <div className="grid grid-cols-3 gap-6">
          <StatCard icon={<UserCheck className="text-blue-500" />} label="အသုံးပြုသူစုစုပေါင်း" value={filteredUsers.length} color="bg-blue-50" />
          <StatCard icon={<Activity className="text-emerald-500" />} label="လက်ရှိဝန်ထမ်း" value={activeTab === "staff" ? filteredUsers.length : "-"} color="bg-emerald-50" />
          <StatCard icon={<ShieldCheck className="text-orange-500" />} label="စနစ်အခြေအနေ" value="ချိတ်ဆက်ပြီး" color="bg-orange-50" />
        </div>
      </main>

      <AddUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        activeTab={activeTab}
        onAddUser={handleAddUser}
        isSaving={isSaving}
      />
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
    <div className={`size-14 rounded-2xl ${color} flex items-center justify-center shrink-0`}>{icon}</div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-slate-900 tracking-tighter">{value}</p>
    </div>
  </div>
);

export default CustomerManagement;
