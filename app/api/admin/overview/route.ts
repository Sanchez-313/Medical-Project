import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import type { RowDataPacket } from "mysql2";

/** Owner-only dashboard aggregate — backs app/admin/page.js (the ported AdminDashboard.jsx). */
export async function GET() {
  const gate = await requireRole(ROLE_GROUPS.OWNER_ONLY);
  if (!gate.ok) return gate.response;

  const [[stockValueRow]] = await pool.query<RowDataPacket[]>(
    `SELECT COALESCE(SUM(stock_qty * selling_price_ks), 0) AS totalStockValueKs FROM medicines WHERE is_active = 1`
  );
  const [[lowStockRow]] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS lowStockCount FROM medicines WHERE status = 'low' OR stock_qty <= reorder_level`
  );
  const [[salesRow]] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS totalSalesCount FROM sales WHERE status = 'completed'`
  );
  const [[customerRow]] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS registeredCustomerCount FROM users WHERE role = 'user'`
  );

  const [monthlyRevenue] = await pool.query<RowDataPacket[]>(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COALESCE(SUM(total_ks), 0) AS revenueKs
     FROM sales
     WHERE status = 'completed' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 MONTH)
     GROUP BY month
     ORDER BY month ASC`
  );

  const [recentSales] = await pool.query<RowDataPacket[]>(
    `SELECT sale_code, customer_name, total_ks, payment_method, created_at
     FROM sales
     ORDER BY created_at DESC
     LIMIT 5`
  );

  return NextResponse.json({
    success: true,
    data: {
      totalStockValueKs: stockValueRow.totalStockValueKs,
      lowStockCount: lowStockRow.lowStockCount,
      totalSalesCount: salesRow.totalSalesCount,
      registeredCustomerCount: customerRow.registeredCustomerCount,
      monthlyRevenue,
      recentSales,
    },
  });
}
