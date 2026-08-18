import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import type { RowDataPacket } from "mysql2";

function toCsv(rows: Array<Record<string, string | number>>): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: string | number) => {
    const str = String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

/**
 * Sales-based reporting, combining BOTH transaction sources the same way
 * /api/admin/orders already does for the Orders table:
 *   - `sales`  = in-store POS/checkout, status = 'completed'
 *   - `orders` = storefront customer checkout, any non-cancelled status
 *     (revenue is booked once an order is placed, same as a completed POS
 *     sale — 'pending' just means payment review hasn't happened yet, not
 *     that no sale occurred)
 * This used to be sales-only — half of "real checkout data" was silently
 * missing from every total, the day-by-day breakdown, and the CSV export.
 * ?from=YYYY-MM-DD&to=YYYY-MM-DD filters the period (defaults to the last 30
 * days). ?format=csv streams the day-by-day breakdown as a CSV download
 * instead of JSON.
 */
export async function GET(request: Request) {
  const gate = await requireRole(ROLE_GROUPS.OWNER_ONLY);
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");
  const from = searchParams.get("from") || null;
  const to = searchParams.get("to") || null;

  // Default window: last 30 days (inclusive of today) when no range is given.
  const params = {
    from: from ?? null,
    to: to ?? null,
  };

  const dateFilter = (column: string) => `
    ${column} >= COALESCE(:from, DATE_SUB(CURDATE(), INTERVAL 29 DAY))
    AND ${column} < DATE_ADD(COALESCE(:to, CURDATE()), INTERVAL 1 DAY)
  `;

  // One combined view of both transaction sources, reused by all three
  // aggregate queries below instead of triplicating the same UNION.
  const transactionsCte = `
    WITH transactions AS (
      (SELECT total_ks, payment_method, created_at FROM sales WHERE status = 'completed' AND ${dateFilter("created_at")})
      UNION ALL
      (SELECT total_ks, payment_method, created_at FROM orders WHERE status <> 'cancelled' AND ${dateFilter("created_at")})
    )
  `;

  const [[totals]] = await pool.query<RowDataPacket[]>(
    `${transactionsCte}
     SELECT COUNT(*) AS saleCount, COALESCE(SUM(total_ks), 0) AS totalRevenueKs, COALESCE(AVG(total_ks), 0) AS avgSaleKs
     FROM transactions`,
    { from: params.from, to: params.to }
  );

  const [byPaymentMethod] = await pool.query<RowDataPacket[]>(
    `${transactionsCte}
     SELECT payment_method, COUNT(*) AS count, COALESCE(SUM(total_ks), 0) AS totalKs
     FROM transactions
     GROUP BY payment_method
     ORDER BY totalKs DESC`,
    { from: params.from, to: params.to }
  );

  const [daily] = await pool.query<RowDataPacket[]>(
    `${transactionsCte}
     SELECT DATE(created_at) AS date, COUNT(*) AS saleCount, COALESCE(SUM(total_ks), 0) AS revenueKs
     FROM transactions
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
    { from: params.from, to: params.to }
  );

  if (format === "csv") {
    const csv = toCsv(
      daily.map((row) => ({
        date: new Date(row.date).toISOString().slice(0, 10),
        sales: row.saleCount,
        revenue_ks: row.revenueKs,
      }))
    );
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="sales-report-${params.from ?? "last30days"}-to-${params.to ?? "today"}.csv"`,
      },
    });
  }

  return NextResponse.json({ success: true, data: { totals, byPaymentMethod, daily } });
}
