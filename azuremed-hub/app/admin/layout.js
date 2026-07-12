import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Dashboards must never be indexed by search engines — this is separate from
// (and does not affect) the public storefront's SEO metadata in app/layout.js.
export const metadata = {
  title: "Owner Dashboard | AzureMed Hub",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }) {
  // middleware.ts already blocks non-owner requests at the edge, but a
  // Server Component must never assume that ran — re-check here so a direct
  // render can't leak data if the middleware matcher config ever drifts.
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "owner") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 border-r border-slate-200 p-4 dark:border-slate-800">
        <p className="mb-4 text-sm font-medium text-slate-500">
          Owner &middot; {session.user.name}
        </p>
        <nav className="flex flex-col gap-1 text-sm">
          <a href="/admin" className="rounded px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            Financial Overview
          </a>
          <a href="/staff" className="rounded px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            Staff View
          </a>
        </nav>
        {/* Full medicine CRUD is served by /api/admin/medicines; wire a
            dedicated /admin/medicines page to it following this same
            layout+Server-Component pattern when that screen is built. */}
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
