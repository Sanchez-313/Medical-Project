import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata = {
  title: "Staff Dashboard | AzureMed Hub",
  robots: { index: false, follow: false },
};

export default async function StaffLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["owner", "staff"].includes(session.user.role)) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 border-r border-slate-200 p-4 dark:border-slate-800">
        <p className="mb-4 text-sm font-medium text-slate-500">
          Staff &middot; {session.user.name}
        </p>
        <nav className="flex flex-col gap-1 text-sm">
          <a href="/staff" className="rounded px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            POS / Checkout
          </a>
        </nav>
        {/* Stock + checkout data both render inline on this page via
            /api/staff/medicines and /api/staff/sales; split into separate
            routes here if the POS screen grows. */}
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
