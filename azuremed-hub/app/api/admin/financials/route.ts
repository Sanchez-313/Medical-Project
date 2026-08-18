import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import type { RowDataPacket } from "mysql2";

/**
 * Owner-only endpoint (guarded twice: middleware.ts path prefix + requireRole
 * here). Admin/Staff pages must never import from this module or route —
 * cost_price_ks and revenue aggregates only ever leave the server here.
 */
export async function GET() {
  const gate = await requireRole(ROLE_GROUPS.OWNER_ONLY);
  if (!gate.ok) return gate.response;

  const [[revenueRow]] = await pool.query<RowDataPacket[]>(
    `SELECT
       COALESCE(SUM(total_ks), 0) AS totalRevenueKs,
       COALESCE(SUM(subtotal_ks), 0) AS totalSubtotalKs,
       COALESCE(SUM(tax_ks), 0) AS totalTaxKs,
       COUNT(*) AS orderCount
     FROM sales
     WHERE status = 'completed'`
  );

  const [marginRows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, stock_qty AS stock,
            (selling_price_ks - cost_price_ks) AS unitMarginKs
     FROM medicines
     WHERE cost_price_ks IS NOT NULL`
  );

  const estimatedInventoryMarginKs = marginRows.reduce(
    (sum, row) => sum + Number(row.unitMarginKs || 0) * Number(row.stock || 0),
    0
  );

  return NextResponse.json({
    success: true,
    data: {
      totalRevenueKs: Number(revenueRow.totalRevenueKs),
      totalSubtotalKs: Number(revenueRow.totalSubtotalKs),
      totalTaxKs: Number(revenueRow.totalTaxKs),
      orderCount: Number(revenueRow.orderCount),
      estimatedInventoryMarginKs,
      marginByProduct: marginRows,
    },
  });
}
