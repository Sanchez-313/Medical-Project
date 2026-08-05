import Link from "next/link";
import { ShoppingCart, ScanEye, PackageSearch } from "lucide-react";

const ACTIONS = [
  { label: "New Sale", description: "Open POS checkout", href: "/staff/pos", icon: ShoppingCart, color: "bg-blue-50 text-blue-500" },
  { label: "Detect Medicine", description: "Identify a product by photo", href: "/detect-medicine", icon: ScanEye, color: "bg-indigo-50 text-indigo-500" },
  { label: "View Stock", description: "Jump to the stock table", href: "/staff#stock", icon: PackageSearch, color: "bg-emerald-50 text-emerald-500" },
];

export default function StaffQuickActions() {
  return (
    <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 font-black text-slate-900">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {ACTIONS.map(({ label, description, href, icon: Icon, color }) => (
          <Link
            key={label}
            href={href}
            className="flex flex-col items-start gap-3 rounded-2xl border border-slate-100 p-4 transition-all hover:border-blue-200 hover:shadow-md"
          >
            <div className={`flex size-10 items-center justify-center rounded-xl ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800">{label}</p>
              <p className="text-xs font-semibold text-slate-400">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
