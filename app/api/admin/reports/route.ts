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
 * Sales-based reporting (matches app/api/admin/overview's existing
 * definition of revenue — POS `sales` only, not storefront `orders`; a
 * pre-existing scope of this dashboard, not something this change expands).
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

  const dateFilter = `
    created_at >= COALESCE(:from, DATE_SUB(CURDATE(), INTERVAL 29 DAY))
    AND created_at < DATE_ADD(COALESCE(:to, CURDATE()), INTERVAL 1 DAY)
  `;

  const [[totals]] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS saleCount, COALESCE(SUM(total_ks), 0) AS totalRevenueKs, COALESCE(AVG(total_ks), 0) AS avgSaleKs
     FROM sales WHERE status = 'completed' AND ${dateFilter}`,
    params
  );

  const [byPaymentMethod] = await pool.query<RowDataPacket[]>(
    `SELECT payment_method, COUNT(*) AS count, COALESCE(SUM(total_ks), 0) AS totalKs
     FROM sales WHERE status = 'completed' AND ${dateFilter}
     GROUP BY payment_method
     ORDER BY totalKs DESC`,
    params
  );

  const [daily] = await pool.query<RowDataPacket[]>(
    `SELECT DATE(created_at) AS date, COUNT(*) AS saleCount, COALESCE(SUM(total_ks), 0) AS revenueKs
     FROM sales WHERE status = 'completed' AND ${dateFilter}
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
    params
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
