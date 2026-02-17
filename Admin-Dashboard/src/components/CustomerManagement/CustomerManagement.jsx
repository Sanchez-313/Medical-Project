import React, { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Users,
  UserCheck,
  Search,
  Plus,
  Download,
  History,
  LayoutDashboard,
  Package,
  Truck,
  BarChart3,
  ShieldCheck,
  Activity,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

import Logo from "../../assets/Logo/logo.png";

// --- SUB-COMPONENT: ADD USER MODAL ---
const AddUserModal = ({ isOpen, onClose, activeTab, onAddUser }) => {
  const getDefaultRole = (tab) =>
    tab === "staff" ? "Inventory Manager" : "Premium Customer";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: getDefaultRole(activeTab),
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      role: getDefaultRole(activeTab),
    }));
  }, [activeTab]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const initial = formData.name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase();

    const id =
      activeTab === "staff"
        ? `STAFF-${Math.floor(100 + Math.random() * 900)}`
        : `MED-${Math.floor(1000 + Math.random() * 9000)}`;

    const newUser = {
      id,
      name: formData.name,
      initial: initial || "??",
      type: activeTab,
      role: formData.role,
      email: formData.email,
      activity: "Just now",
      color:
        activeTab === "staff"
          ? "bg-orange-100 text-orange-600"
          : "bg-blue-100 text-blue-600",
    };

    onAddUser(newUser);
    setFormData({ name: "", email: "", role: getDefaultRole(activeTab) });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Add New {activeTab === "staff" ? "Staff Member" : "Customer"}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
              <X size={24} />
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g. Jane Doe"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Role / Tier</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm outline-none appearance-none"
                >
                  {activeTab === "staff" ? (
                    <>
                      <option>Inventory Manager</option>
                      <option>Logistics Lead</option>
                      <option>Super Admin</option>
                    </>
                  ) : (
                    <>
                      <option>Premium Customer</option>
                      <option>Standard Customer</option>
                      <option>Wholesale Partner</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="jane@example.com"
              />
            </div>

            <div className="pt-4 flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 px-6 py-3.5 rounded-2xl text-sm font-black text-slate-500 hover:bg-slate-50 transition-all">Cancel</button>
              <button type="submit" className="flex-1 bg-blue-600 px-6 py-3.5 rounded-2xl text-sm font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">Confirm Registration</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const CustomerManagement = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("customers");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [userList, setUserList] = useState([
    { id: "MED-9821", name: "John Doe", initial: "JD", type: "customers", role: "Premium Customer", email: "john.doe@medicare.com", activity: "2 hours ago", color: "bg-blue-100 text-blue-600" },
    { id: "STAFF-001", name: "Admin Sarah", initial: "AS", type: "staff", role: "Super Admin", email: "sarah.w@inventory.med", activity: "Active Now", color: "bg-orange-100 text-orange-600" },
    { id: "MED-4422", name: "Robert Brown", initial: "RB", type: "customers", role: "Standard Customer", email: "robert@email.com", activity: "Yesterday", color: "bg-gray-200 text-gray-600" },
    { id: "STAFF-002", name: "Mark Smith", initial: "MS", type: "staff", role: "Logistics Manager", email: "mark.log@inventory.med", activity: "15 mins ago", color: "bg-green-100 text-green-700" },
  ]);

  const handleAddUser = (newUser) => setUserList((prev) => [...prev, newUser]);

  const filteredUsers = useMemo(() => {
    return userList.filter((user) => {
      const matchesTab = user.type === activeTab;
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            user.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchQuery, userList]);

  // Reset page when filtering
  useEffect(() => setCurrentPage(1), [searchQuery, activeTab]);
  

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) setCurrentPage(pageNumber);
  };

  const navItems = [
    { name: "Dashboard", path: "/overview", icon: <LayoutDashboard size={20} /> },
    { name: "ဆေးဝါးစာရင်း", path: "/inventory", icon: <Package size={20} /> },
    { name: "ဖောက်သည်များ", path: "/customers", icon: <Users size={20} /> },
    { name: "ပို့ဆောင်ရေး", path: "/deliveries", icon: <Truck size={20} /> },
    { name: "အစီရင်ခံစာ", path: "/reports", icon: <BarChart3 size={20} /> },
  ];

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans text-slate-900">
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col sticky top-0 h-screen shrink-0">
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-10">
            <img src={Logo} alt="Logo" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold tracking-tighter text-indigo-400 uppercase italic">AzureMed hub</span>
          </div>
          <nav className="flex flex-col gap-2 flex-grow">
            {navItems.map((item) => (
              <Link key={item.name} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${location.pathname === item.path ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-500 hover:bg-slate-50"}`}>
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
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-md">
            <Plus size={18} /> Add New User
          </button>
        </header>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden mb-8">
          <div className="flex border-b border-slate-100 px-8">
            {["customers", "staff"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 pt-6 px-6 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
                {tab === "customers" ? "Registered Customers" : "Staff Users"}
                <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-50 text-[10px]">{userList.filter((u) => u.type === tab).length}</span>
              </button>
            ))}
          </div>

          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
                  <th className="px-8 py-5">User Details</th>
                  <th className="px-6 py-5">Role</th>
                  <th className="px-6 py-5">Contact</th>
                  <th className="px-6 py-5">Activity</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {currentItems.length > 0 ? (
                  currentItems.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`size-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${user.color}`}>{user.initial}</div>
                          <div>
                            <p className="text-sm font-black text-slate-800">{user.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{user.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${user.type === "staff" ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"}`}>{user.role}</span>
                      </td>
                      <td className="px-6 py-5 text-xs font-bold text-slate-500">{user.email}</td>
                      <td className="px-6 py-5 text-xs font-bold text-slate-500">{user.activity}</td>
                      <td className="px-6 py-5 text-right font-black text-[10px] text-blue-600 uppercase cursor-pointer hover:underline">Manage</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="px-8 py-20 text-center text-slate-400 font-bold">No results found matching "{searchQuery}"</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION FOOTER - FIXED VARIABLES HERE */}
          <div className="px-8 py-5 border-t border-slate-50 flex items-center justify-between bg-slate-50/20">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Showing {filteredUsers.length > 0 ? indexOfFirstItem + 1 : 0} to {Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length} entries
            </p>

            <div className="flex items-center gap-1">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className={`p-2 rounded-lg border border-slate-200 transition-all ${currentPage === 1 ? "opacity-20 cursor-not-allowed" : "hover:bg-white hover:text-blue-600 shadow-sm"}`}>
                <ChevronLeft size={16} />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i + 1} onClick={() => handlePageChange(i + 1)} className={`min-w-[36px] h-9 rounded-lg text-xs font-black border ${currentPage === i + 1 ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100" : "bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600"}`}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className={`p-2 rounded-lg border border-slate-200 transition-all ${currentPage === totalPages ? "opacity-20 cursor-not-allowed" : "hover:bg-white hover:text-blue-600 shadow-sm"}`}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <StatCard icon={<UserCheck className="text-blue-500" />} label="Total Users" value={userList.length} color="bg-blue-50" />
          <StatCard icon={<Activity className="text-emerald-500" />} label="Active Staff" value={userList.filter(u => u.type === "staff").length} color="bg-emerald-50" />
          <StatCard icon={<ShieldCheck className="text-orange-500" />} label="System Health" value="Optimal" color="bg-orange-50" />
        </div>
      </main>

      <AddUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} activeTab={activeTab} onAddUser={handleAddUser} />
    </div>
  );
};

// Helper component for bottom cards
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