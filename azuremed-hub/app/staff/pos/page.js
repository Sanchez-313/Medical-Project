import pool from "@/config/db";
import PosForm from "@/components/PosForm";

// The parent layout's getServerSession() call doesn't reliably signal
// dynamic rendering to Next's static analysis (it's wrapped several layers
// deep, not a direct cookies()/headers() call) — without this, the page
// gets silently build-time prerendered, which tries to connect to the DB at
// build time and fails on hosts (Vercel) that can't reach it.
export const dynamic = "force-dynamic";

export default async function StaffPosPage() {
  const [medicines] = await pool.query(
    `SELECT id, name, selling_price_ks, stock_qty
     FROM medicines
     WHERE is_active = 1
     ORDER BY name ASC`
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">အရောင်း / POS</h1>
        <p className="pt-3 text-slate-500">Process a walk-in sale and record checkout.</p>
      </div>
      <PosForm medicines={medicines} endpoint="/api/staff/sales" />
    </div>
  );
}
