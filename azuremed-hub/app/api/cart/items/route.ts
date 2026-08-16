import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export async function POST(request: Request) {
  const gate = await requireRole(ROLE_GROUPS.ANY_AUTHENTICATED);
  if (!gate.ok) return gate.response;

  const body = await request.json();
  const { product_id, qty } = body as { product_id: number; qty?: number };
  const userId = Number(gate.session.user.id);
  const addQty = Math.max(1, Number(qty) || 1);

  const [[medicine]] = await pool.query<RowDataPacket[]>(
    "SELECT id, stock_qty FROM medicines WHERE id = :id AND is_active = 1",
    { id: product_id }
  );
  if (!medicine) {
    return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
  }
  if (medicine.stock_qty <= 0) {
    return NextResponse.json({ success: false, message: "This product is out of stock" }, { status: 409 });
  }

  // Clamp on both paths — LEAST(...) alone only covers the ON DUPLICATE KEY
  // UPDATE branch (a second add of the same item); the plain INSERT branch
  // (first add) needs its own clamp or a single request could add more than
  // the available stock straight into the cart.
  const clampedQty = Math.min(addQty, medicine.stock_qty);

  await pool.query<ResultSetHeader>(
    `INSERT INTO cart_items (user_id, medicine_id, qty)
     VALUES (:user_id, :medicine_id, :qty)
     ON DUPLICATE KEY UPDATE qty = LEAST(qty + VALUES(qty), :stock)`,
    { user_id: userId, medicine_id: product_id, qty: clampedQty, stock: medicine.stock_qty }
  );

  return NextResponse.json({ success: true }, { status: 201 });
}
