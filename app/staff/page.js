import pool from "@/config/db";
import StaffDashboardView from "@/components/StaffDashboardView";

// The parent layout's getServerSession() call doesn't reliably signal
// dynamic rendering to Next's static analysis (it's wrapped several layers
// deep, not a direct cookies()/headers() call) — without this, the page
// gets silently build-time prerendered, which tries to connect to the DB at
// build time and fails on hosts (Vercel) that can't reach it.
export const dynamic = "force-dynamic";

/**
 * Staff stock view — never selects cost_price_ks or revenue; this is a
 * different query from app/admin, not the same one with fields hidden.
 * Only the initial render happens here — StaffDashboardView (client) takes
 * it from there and polls /api/staff/medicines for live updates.
 */
export default async function StaffDashboardPage() {
  const [stockRows] = await pool.query(
    `SELECT id, name, sku, category, selling_price_ks, stock_qty, status
     FROM medicines
     WHERE is_active = 1
     ORDER BY name ASC`
  );

  return <StaffDashboardView initialStockRows={stockRows} />;
}
