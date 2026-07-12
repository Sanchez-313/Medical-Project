import pool from "@/config/db";
import PosForm from "@/components/PosForm";

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
