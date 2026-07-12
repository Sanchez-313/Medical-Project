import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

/**
 * Owner-only full medicine CRUD, including cost_price_ks. Staff get a
 * separate, cost-stripped read endpoint at /api/staff/medicines instead of a
 * role-conditional select here, so it's obvious at a glance which fields
 * each audience can ever receive.
 */
export async function GET(request: Request) {
  const gate = await requireRole(ROLE_GROUPS.OWNER_ONLY);
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();
  const category = searchParams.get("category")?.trim();

  const conditions: string[] = [];
  const params: Record<string, string> = {};
  if (search) {
    conditions.push("name LIKE :search");
    params.search = `%${search}%`;
  }
  if (category) {
    conditions.push("category = :category");
    params.category = category;
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, sku, category, selling_price_ks, cost_price_ks, stock_qty, reorder_level, expiry_date, status
     FROM medicines ${where} ORDER BY name ASC`,
    params
  );

  return NextResponse.json({ success: true, data: rows });
}

export async function PATCH(request: Request) {
  const gate = await requireRole(ROLE_GROUPS.OWNER_ONLY);
  if (!gate.ok) return gate.response;

  const body = await request.json();
  const { id, stock_qty, selling_price_ks, cost_price_ks, status } = body as {
    id: number;
    stock_qty?: number;
    selling_price_ks?: number;
    cost_price_ks?: number;
    status?: "normal" | "low" | "expired";
  };

  if (!id) {
    return NextResponse.json({ success: false, message: "id is required" }, { status: 400 });
  }

  const sets: string[] = [];
  const params: Record<string, unknown> = { id };
  if (stock_qty !== undefined) { sets.push("stock_qty = :stock_qty"); params.stock_qty = stock_qty; }
  if (selling_price_ks !== undefined) { sets.push("selling_price_ks = :selling_price_ks"); params.selling_price_ks = selling_price_ks; }
  if (cost_price_ks !== undefined) { sets.push("cost_price_ks = :cost_price_ks"); params.cost_price_ks = cost_price_ks; }
  if (status !== undefined) { sets.push("status = :status"); params.status = status; }

  if (!sets.length) {
    return NextResponse.json({ success: false, message: "no fields to update" }, { status: 400 });
  }

  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE medicines SET ${sets.join(", ")} WHERE id = :id`,
    params
  );

  if (result.affectedRows === 0) {
    return NextResponse.json({ success: false, message: "medicine not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
