import pool from "@/config/db";

/**
 * Owner dashboard — Server Component, so this data is fetched on the server
 * during SSR/RSC render and the raw SQL/connection pool never ships to the
 * client bundle. Role verification for this whole route tree already
 * happened in app/admin/layout.js.
 */
export default async function AdminDashboardPage() {
  const [[revenueRow]] = await pool.query(
    `SELECT
       COALESCE(SUM(total_ks), 0) AS totalRevenueKs,
       COUNT(*) AS orderCount
     FROM sales
     WHERE status = 'completed'`
  );

  const [lowStockRows] = await pool.query(
    `SELECT id, name, stock_qty, reorder_level
     FROM medicines
     WHERE status = 'low' OR stock_qty <= reorder_level
     ORDER BY stock_qty ASC
     LIMIT 10`
  );

  const [marginRows] = await pool.query(
    `SELECT
       COALESCE(SUM((selling_price_ks - cost_price_ks) * stock_qty), 0) AS estimatedMarginKs
     FROM medicines
     WHERE cost_price_ks IS NOT NULL`
  );

  const [recentSales] = await pool.query(
    `SELECT sale_code, total_ks, payment_method, created_at
     FROM sales
     ORDER BY created_at DESC
     LIMIT 8`
  );

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Owner Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded border p-4">
          <p className="text-sm text-slate-500">Total Revenue</p>
          <p className="text-2xl font-bold">{Number(revenueRow.totalRevenueKs).toLocaleString()} Ks</p>
        </div>
        <div className="rounded border p-4">
          <p className="text-sm text-slate-500">Completed Orders</p>
          <p className="text-2xl font-bold">{revenueRow.orderCount}</p>
        </div>
        <div className="rounded border p-4">
          <p className="text-sm text-slate-500">Estimated Inventory Margin</p>
          <p className="text-2xl font-bold">{Number(marginRows[0].estimatedMarginKs).toLocaleString()} Ks</p>
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-lg font-medium">Low Stock Alerts</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2">Medicine</th>
              <th>Stock</th>
              <th>Reorder Level</th>
            </tr>
          </thead>
          <tbody>
            {lowStockRows.map((item) => (
              <tr key={item.id} className="border-t border-slate-200 dark:border-slate-800">
                <td className="py-2">{item.name}</td>
                <td>{item.stock_qty}</td>
                <td>{item.reorder_level}</td>
              </tr>
            ))}
            {lowStockRows.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-slate-500">No low-stock items right now.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-medium">Recent Sales</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2">Sale Code</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {recentSales.map((sale) => (
              <tr key={sale.sale_code} className="border-t border-slate-200 dark:border-slate-800">
                <td className="py-2">{sale.sale_code}</td>
                <td>{Number(sale.total_ks).toLocaleString()} Ks</td>
                <td>{sale.payment_method}</td>
                <td>{new Date(sale.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
