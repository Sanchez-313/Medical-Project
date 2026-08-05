import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import type { RowDataPacket } from "mysql2";

/** Real registered customers (role='user') — no separate customers table in this schema. */
export async function GET(request: Request) {
  const gate = await requireRole(ROLE_GROUPS.OWNER_ONLY);
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();

  // orderCount = orders the customer actually placed via storefront checkout
  // (orders.user_id), not sales.handled_by_user_id — that column is the
  // staff/agent who ran a POS transaction, which is never a customer.
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.id, u.name, u.email, u.created_at,
            COUNT(o.id) AS orderCount,
            COALESCE(SUM(o.total_ks), 0) AS totalSpentKs
     FROM users u
     LEFT JOIN orders o ON o.user_id = u.id
     WHERE u.role = 'user' AND (:search IS NULL OR u.name LIKE CONCAT('%', :search, '%') OR u.email LIKE CONCAT('%', :search, '%'))
     GROUP BY u.id
     ORDER BY u.created_at DESC`,
    { search: search || null }
  );

  return NextResponse.json({ success: true, data: rows });
}
