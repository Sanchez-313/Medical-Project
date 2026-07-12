import pool from "@/config/db";

/**
 * Staff dashboard — Server Component. Note the SELECT list below never
 * includes selling cost, margin, or company-wide revenue: this is a
 * different query from app/admin/page.js, not the same query with fields
 * hidden in the UI, so there is no path where that data reaches a staff
 * session even via devtools/network tab.
 */
export default async function StaffDashboardPage() {
  const [stockRows] = await pool.query(
    `SELECT id, name, sku, category, selling_price_ks, stock_qty, status
     FROM medicines
     WHERE is_active = 1
     ORDER BY name ASC
     LIMIT 25`
  );

  const [recentSales] = await pool.query(
    `SELECT sale_code, customer_name, total_ks, payment_method, created_at
     FROM sales
     ORDER BY created_at DESC
     LIMIT 10`
  );

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Staff Dashboard</h1>
      <p className="text-sm text-slate-500">
        Operational view only — pricing shown is the customer-facing selling
        price. Cost price and revenue totals are not available here.
      </p>

      <section>
        <h2 className="mb-2 text-lg font-medium">Stock Availability</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2">Medicine</th>
              <th>SKU</th>
              <th>Price (Ks)</th>
              <th>Stock</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {stockRows.map((item) => (
              <tr key={item.id} className="border-t border-slate-200 dark:border-slate-800">
                <td className="py-2">{item.name}</td>
                <td>{item.sku}</td>
                <td>{Number(item.selling_price_ks).toLocaleString()}</td>
                <td>{item.stock_qty}</td>
                <td>{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-medium">Recent Checkouts</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2">Sale Code</th>
              <th>Customer</th>
              <th>Total (Ks)</th>
              <th>Payment</th>
            </tr>
          </thead>
          <tbody>
            {recentSales.map((sale) => (
              <tr key={sale.sale_code} className="border-t border-slate-200 dark:border-slate-800">
                <td className="py-2">{sale.sale_code}</td>
                <td>{sale.customer_name ?? "Walk-in"}</td>
                <td>{Number(sale.total_ks).toLocaleString()}</td>
                <td>{sale.payment_method}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
