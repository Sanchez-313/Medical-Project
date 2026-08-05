import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

/**
 * Staff/cashier "View Product List" + "Manage Inventory" — read the full
 * catalog and adjust stock quantities only. Full product editing (name,
 * category, price, description, image, expiry, creating new products) is
 * Owner-only at /api/admin/medicines — this route never accepts those
 * fields, and never selects cost_price_ks.
 */
export async function GET() {
  const gate = await requireRole(ROLE_GROUPS.MANAGERIAL);
  if (!gate.ok) return gate.response;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, sku, category, image_url, selling_price_ks,
            stock_qty, reorder_level, expiry_date, status
     FROM medicines
     WHERE is_active = 1
     ORDER BY name ASC`
  );

  return NextResponse.json({ success: true, data: rows });
}

/** Adjust stock quantity only — the "Manage Inventory" use case. */
export async function PATCH(request: Request) {
  const gate = await requireRole(ROLE_GROUPS.MANAGERIAL);
  if (!gate.ok) return gate.response;

  const { id, stock_qty } = (await request.json()) as { id?: number; stock_qty?: number };
  if (!id || !Number.isInteger(stock_qty) || stock_qty! < 0) {
    return NextResponse.json(
      { success: false, message: "id and a non-negative whole stock quantity are required" },
      { status: 400 }
    );
  }

  const [[existing]] = await pool.query<RowDataPacket[]>(
    "SELECT reorder_level, expiry_date FROM medicines WHERE id = :id AND is_active = 1",
    { id }
  );
  if (!existing) {
    return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
  }

  const status =
    existing.expiry_date && new Date(existing.expiry_date) < new Date()
      ? "expired"
      : stock_qty! <= existing.reorder_level
      ? "low"
      : "normal";

  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE medicines SET stock_qty = :stock_qty, status = :status WHERE id = :id",
    { stock_qty, status, id }
  );
  if (result.affectedRows === 0) {
    return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
