import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import type { RowDataPacket } from "mysql2";

/**
 * Staff/cashier stock view. The SELECT list deliberately never includes
 * cost_price_ks — this is a different query from the owner endpoint, not a
 * role-conditional field toggle, so there is no code path that can leak
 * margin data to a staff session.
 */
export async function GET() {
  const gate = await requireRole(ROLE_GROUPS.MANAGERIAL);
  if (!gate.ok) return gate.response;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, sku, category, selling_price_ks, stock_qty, status
     FROM medicines
     WHERE is_active = 1
     ORDER BY name ASC`
  );

  return NextResponse.json({ success: true, data: rows });
}
