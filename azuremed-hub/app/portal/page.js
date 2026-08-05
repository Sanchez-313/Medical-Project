import pool from "@/config/db";
import PosForm from "@/components/PosForm";

// The parent layout's getServerSession() call doesn't reliably signal
// dynamic rendering to Next's static analysis (it's wrapped several layers
// deep, not a direct cookies()/headers() call) — without this, the page
// gets silently build-time prerendered, which tries to connect to the DB at
// build time and fails on hosts (Vercel) that can't reach it.
export const dynamic = "force-dynamic";

/**
 * Agent portal — Server Component fetches the stock list (SSR, no
 * cost_price_ks ever selected here); the interactive checkout is a small
 * Client Component (PosForm) that posts to /api/portal/sales.
 */
export default async function PortalPage() {
  const [medicines] = await pool.query(
    `SELECT id, name, selling_price_ks, stock_qty, status
     FROM medicines
     WHERE is_active = 1
     ORDER BY name ASC`
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Agent Portal</h1>
      <p className="text-sm text-slate-500">
        Browse current stock and record a sale. Cost price and company
        revenue are not available here.
      </p>
      <PosForm medicines={medicines} />
    </div>
  );
}
