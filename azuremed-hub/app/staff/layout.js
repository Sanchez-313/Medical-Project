import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/config/db";
import StaffSidebar from "@/components/StaffSidebar";

export const metadata = {
  title: "Staff Dashboard | AzureMed Hub",
  robots: { index: false, follow: false },
};

// Now runs its own DB query (low-stock count for the sidebar) — without
// this, Next may try to statically prerender it at build time and fail to
// reach the DB on hosts (Vercel) that can't connect during the build step.
export const dynamic = "force-dynamic";

export default async function StaffLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "staff"].includes(session.user.role)) {
    redirect("/login");
  }

  // Sidebar "quick glance" card — also fills what used to be a big empty
  // gap between the nav items and Logout with something actually useful.
  const [[{ lowStockCount }]] = await pool.query(
    `SELECT COUNT(*) AS lowStockCount FROM medicines WHERE is_active = 1 AND status = 'low'`
  );

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <StaffSidebar userName={session.user.name} lowStockCount={lowStockCount} />
      {/* ml-64 matches the sidebar's fixed width — a `fixed` element is out
          of document flow entirely, unlike `sticky`, so content underneath
          needs this margin or it slides under the sidebar. */}
      <main className="ml-64 p-8">{children}</main>
    </div>
  );
}
