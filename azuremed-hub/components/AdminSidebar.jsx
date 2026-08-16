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
  Settings2,
  Megaphone,
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
  { name: "Advertisements", path: "/admin/advertisements", icon: <Megaphone size={20} /> },
];

export default function AdminSidebar({ userName }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col fixed top-0 left-0 h-full shrink-0 z-40">
      <div className="p-5 flex flex-col h-full overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <Image src="/images/logo.png" alt="Logo" width={40} height={40} className="w-10 h-10 object-contain" />
          <div className="flex flex-col leading-none">
            <span className="text-xl font-bold tracking-tighter text-indigo-400 uppercase italic">
              AzureMed<span className="text-blue-600"> hub</span>
            </span>
          </div>
        </div>
        <p className="mb-6 text-xs font-semibold text-slate-400">Admin &middot; {userName}</p>

        {/* min-h-0 overrides the flex item's default min-height:auto — without
            it, this can't actually shrink to fit and overflow-y-auto never
            kicks in, so it just grows past the sidebar and pushes
            LogoutButton off-screen instead of scrolling internally. Capped
            at 150px so the nav list always scrolls internally rather than
            pushing Logout down — LogoutButton stays pinned right below it
            no matter how many nav items get added later. */}
        <nav className="flex min-h-0 max-h-[150px] flex-col gap-1 flex-grow overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-bold text-sm ${
                  isActive ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {item.icon} {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-16">
          <LogoutButton className="w-full shrink-0" />
        </div>
      </div>
    </aside>
  );
}
