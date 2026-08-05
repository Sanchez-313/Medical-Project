"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  BarChart3,
  ClipboardList,
  PackagePlus,
  ShieldCheck,
  Activity,
  Lock,
  Settings2,
} from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

/**
 * Faithful port of Admin-Dashboard/src/components/AdminDashboard/AdminDashboard.jsx's
 * sidebar (same Myanmar nav labels, icons, and active-state styling), routed
 * into app/admin/* instead of the old Vite app's flat /overview etc. routes.
 */
const NAV_ITEMS = [
  { name: "ဒက်ရှ်ဘုတ်", path: "/admin", icon: <LayoutDashboard size={20} /> },
  { name: "ကုန်ပစ္စည်းစာရင်း", path: "/admin/inventory", icon: <Package size={20} /> },
  { name: "Restock", path: "/admin/restock", icon: <PackagePlus size={20} /> },
  { name: "ဖောက်သည်များ", path: "/admin/customers", icon: <Users size={20} /> },
  { name: "ပို့ဆောင်မှုများ", path: "/admin/deliveries", icon: <Truck size={20} /> },
  { name: "အော်ဒါများ", path: "/admin/orders", icon: <ClipboardList size={20} /> },
  { name: "အစီရင်ခံစာများ", path: "/admin/reports", icon: <BarChart3 size={20} /> },
  { name: "User Management", path: "/admin/users", icon: <ShieldCheck size={20} /> },
  { name: "Activity Log", path: "/admin/activity", icon: <Activity size={20} /> },
  { name: "Settings", path: "/admin/settings", icon: <Settings2 size={20} /> },
  { name: "Security", path: "/account/security", icon: <Lock size={20} /> },
];

export default function AdminSidebar({ userName }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col sticky top-0 h-screen shrink-0">
      <div className="p-6 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-2">
          <Image src="/images/logo.png" alt="Logo" width={40} height={40} className="w-10 h-10 object-contain" />
          <div className="flex flex-col leading-none">
            <span className="text-xl font-bold tracking-tighter text-indigo-400 uppercase italic">
              AzureMed<span className="text-blue-600"> hub</span>
            </span>
          </div>
        </div>
        <p className="mb-8 text-xs font-semibold text-slate-400">Owner &middot; {userName}</p>

        <nav className="flex flex-col gap-2 flex-grow">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                  isActive ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {item.icon} {item.name}
              </Link>
            );
          })}
        </nav>
        
      </div>
      <LogoutButton className="w-1/2 mx-auto mb-6" />
    </aside>
  );
}
