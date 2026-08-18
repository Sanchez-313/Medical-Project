"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Boxes, ShoppingCart, ClipboardList, MessageCircle, AlertTriangle } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import useOrderAttentionCount from "@/components/useOrderAttentionCount";

/**
 * New — the original Admin-Dashboard app had no separate staff role, so
 * there's nothing to port here. Styled to match app/admin's visual language
 * (same sidebar shell, same lucide icons, same rounded-card aesthetic) but
 * with a deliberately smaller nav: staff get stock + product management and
 * order fulfillment, never the financial/customer/reporting screens.
 */
const NAV_GROUPS = [
  {
    label: "Operations",
    items: [
      { name: "ကုန်ပစ္စည်းစတော့", path: "/staff", icon: LayoutDashboard },
      { name: "Products", path: "/staff/products", icon: Boxes },
      { name: "အရောင်း / POS", path: "/staff/pos", icon: ShoppingCart },
      { name: "Customer Orders", path: "/staff/orders", icon: ClipboardList },
      { name: "Customer Queries", path: "/staff/queries", icon: MessageCircle },
    ],
  },
];

export default function StaffSidebar({ userName, lowStockCount = 0 }) {
  const pathname = usePathname();
  const pendingOrderCount = useOrderAttentionCount("/api/staff/orders");

  return (
    <aside className="fixed left-0 top-0 flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-100 p-6">
        <Image src="/images/logo.png" alt="Logo" width={40} height={40} className="h-10 w-10 object-contain" />
        <div className="flex flex-col leading-none">
          <span className="text-xl font-bold tracking-tighter text-indigo-400 uppercase italic">
            AzureMed<span className="text-blue-600"> hub</span>
          </span>
          <span className="mt-1 text-[11px] font-semibold text-slate-400">Staff &middot; {userName}</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-6 last:mb-0">
            <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-widest text-slate-300">
              {group.label}
            </p>
            <div className="flex flex-col gap-1.5">
              {group.items.map((item) => {
                const isActive = pathname === item.path;
                const Icon = item.icon;
                const isOrderAlert = item.path === "/staff/orders" && pendingOrderCount > 0;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                      isOrderAlert
                        ? "bg-red-600 text-white shadow-md shadow-red-200 hover:bg-red-700"
                        : isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <Icon size={20} /> {item.name}
                    {isOrderAlert && (
                      <span className="ml-auto min-w-6 animate-pulse rounded-full bg-white px-1.5 py-0.5 text-center text-xs font-black text-red-600">
                        {pendingOrderCount > 99 ? "99+" : pendingOrderCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {lowStockCount > 0 && (
          <Link
            href="/staff/products?filter=low"
            className="mt-2 flex items-center gap-3 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700 transition-all hover:bg-orange-100"
          >
            <AlertTriangle size={18} className="shrink-0" />
            <span>
              {lowStockCount} product{lowStockCount === 1 ? "" : "s"} low on stock
            </span>
          </Link>
        )}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <LogoutButton className="w-full" />
        <p className="mt-3 px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
          No revenue, margin, or customer data on this view.
        </p>
      </div>
    </aside>
  );
}
