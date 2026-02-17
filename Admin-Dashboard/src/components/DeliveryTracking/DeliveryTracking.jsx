import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
// Missing imports added here
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Truck, 
  BarChart3, 
  Plus, 
  Search, 
  Clock, 
  MapPin 
} from "lucide-react";

import Logo from "../../assets/Logo/logo.png";

// Simple SVG Icon Components (Kept for your map styling)
const Icon = ({ path, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
);

const MapIcons = {
  Truck: <Icon path={<><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></>} />,
  MapPin: <Icon path={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>} />
};

const INITIAL_DELIVERIES = [
  { id: "#ORD-8821", hospital: "Central General Hospital", courier: "Alex Rivers", eta: "12 mins", progress: 75, coords: { left: '50%', top: '60%' } },
  { id: "#ORD-8819", hospital: "St. Mary's Pharmacy", courier: "Sarah Chen", eta: "1h 32m", progress: 30, coords: { left: '30%', top: '40%' } },
  { id: "#ORD-8794", hospital: "Northwest Medical", courier: "James Wilson", eta: "Delayed", progress: 90, coords: { left: '70%', top: '25%' } },
];

const navItems = [
  { name: "Dashboard", path: "/overview", icon: <LayoutDashboard size={20} /> },
  { name: "ဆေးဝါးစာရင်း", path: "/inventory", icon: <Package size={20} /> },
  { name: "ဖောက်သည်များ", path: "/customers", icon: <Users size={20} /> },
  { name: "ပို့ဆောင်ရေး", path: "/deliveries", icon: <Truck size={20} /> },
  { name: "အစီရင်ခံစာ", path: "/reports", icon: <BarChart3 size={20} /> },
];

const DeliveryTracking = () => {
  const location = useLocation();
  const [deliveries] = useState(INITIAL_DELIVERIES);
  const [selectedId, setSelectedId] = useState(INITIAL_DELIVERIES[0].id);

  const activeDelivery = deliveries.find(d => d.id === selectedId);

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans text-slate-900">
      
      {/* SIDE NAVIGATION */}
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

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
        
        {/* HEADER */}
        <header className="p-6 border-b border-slate-200 flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Logistics Control</h1>
            <p className="text-slate-500 text-sm">Active medical supply shipments</p>
          </div>
          <button 
            onClick={() => alert("Dispatch Modal Opening...")}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-md transition-all"
          >
            <Plus size={18} /> New Dispatch
          </button>
        </header>

        {/* CONTENT SPLIT: LIST & MAP */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* DELIVERY LIST */}
          <div className="w-[400px] border-r border-slate-100 overflow-y-auto bg-white">
            <div className="p-4 border-b border-slate-50 bg-slate-50/30">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 <input className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-xs outline-none focus:ring-2 focus:ring-blue-500/10" placeholder="Filter by ID or Hospital..." />
               </div>
            </div>

            {deliveries.map((d) => (
              <div 
                key={d.id}
                onClick={() => setSelectedId(d.id)}
                className={`p-6 border-b border-slate-50 cursor-pointer transition-all ${
                  selectedId === d.id ? 'bg-blue-50/50 border-l-4 border-l-blue-600' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider ${
                    selectedId === d.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>{d.id}</span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                    <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                  </span>
                </div>
                
                <h3 className="font-black text-slate-800 text-sm mb-4 leading-tight">{d.hospital}</h3>
                
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2 text-slate-500 font-bold">
                    <div className="size-7 rounded-lg bg-slate-200 flex items-center justify-center text-[10px] text-slate-600">
                      {d.courier.charAt(0)}
                    </div>
                    {d.courier}
                  </div>
                  <div className="flex items-center gap-1 text-blue-600 font-black">
                    <Clock size={14} /> {d.eta}
                  </div>
                </div>

                <div className="mt-5 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full transition-all duration-1000 ease-out" style={{ width: `${d.progress}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* SIMULATED MAP SECTION */}
          <div className="flex-1 bg-slate-50 relative overflow-hidden">
            {/* Map Grid Background */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '30px 30px' }} />
            
            {/* Warehouse Marker */}
            <div className="absolute left-20 top-40 text-blue-600">
              <div className="bg-white px-2 py-1 rounded-lg shadow-sm border border-blue-100 mb-2 text-[10px] font-black uppercase tracking-tighter">Main Hub</div>
              {MapIcons.MapPin}
            </div>

            {/* Dynamic Active Delivery Marker */}
            {activeDelivery && (
              <div 
                className="absolute transition-all duration-1000 ease-in-out text-blue-600" 
                style={{ left: activeDelivery.coords.left, top: activeDelivery.coords.top }}
              >
                <div className="bg-white p-3 rounded-2xl shadow-2xl border border-white mb-3 min-w-[150px]">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Heading to</p>
                   <p className="text-[11px] font-black text-slate-800 truncate">{activeDelivery.hospital}</p>
                   <div className="mt-2 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-blue-600">{activeDelivery.eta} away</span>
                      <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   </div>
                </div>
                <div className="size-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200 ring-4 ring-white animate-bounce">
                  <Truck size={24} className="text-white" />
                </div>
              </div>
            )}

            {/* Map UI Controls */}
            <div className="absolute bottom-8 right-8 flex flex-col gap-2">
              <button className="size-10 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-center font-black text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all">+</button>
              <button className="size-10 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-center font-black text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all">-</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DeliveryTracking;