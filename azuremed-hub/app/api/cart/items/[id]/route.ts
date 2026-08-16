import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

/** [id] here is the medicine_id (matches the original app's /api/cart/items/:productId contract). */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const gate = await requireRole(ROLE_GROUPS.ANY_AUTHENTICATED);
  if (!gate.ok) return gate.response;

  const body = await request.json();
  const requestedQty = Math.max(1, Number(body.qty) || 1);
  const medicineId = Number(params.id);

  const [[medicine]] = await pool.query<RowDataPacket[]>(
    "SELECT stock_qty FROM medicines WHERE id = :id AND is_active = 1",
    { id: medicineId }
  );
  if (!medicine) {
    return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
  }
  if (medicine.stock_qty <= 0) {
    return NextResponse.json({ success: false, message: "This product is out of stock" }, { status: 409 });
  }

  const qty = Math.min(requestedQty, medicine.stock_qty);

  await pool.query<ResultSetHeader>(
    "UPDATE cart_items SET qty = :qty WHERE user_id = :userId AND medicine_id = :medicineId",
    { qty, userId: Number(gate.session.user.id), medicineId }
  );

  return NextResponse.json({ success: true, data: { qty } });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const gate = await requireRole(ROLE_GROUPS.ANY_AUTHENTICATED);
  if (!gate.ok) return gate.response;

  await pool.query<ResultSetHeader>(
    "DELETE FROM cart_items WHERE user_id = :userId AND medicine_id = :medicineId",
    { userId: Number(gate.session.user.id), medicineId: Number(params.id) }
  );

  return NextResponse.json({ success: true });
}
