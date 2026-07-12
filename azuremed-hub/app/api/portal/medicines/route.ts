import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import type { RowDataPacket } from "mysql2";

/**
 * Agent (+ staff/owner) stock browse. Same shape as /api/staff/medicines —
 * never selects cost_price_ks — kept as a separate route because agents are
 * a distinct front-line audience operating from the public portal, not the
 * managerial /staff dashboard.
 */
export async function GET() {
  const gate = await requireRole(ROLE_GROUPS.OPERATIONAL);
  if (!gate.ok) return gate.response;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, sku, category, selling_price_ks, stock_qty, status
     FROM medicines
     WHERE is_active = 1
     ORDER BY name ASC`
  );

  return NextResponse.json({ success: true, data: rows });
}
