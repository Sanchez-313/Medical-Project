import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import type { ResultSetHeader } from "mysql2";

/** [id] here is the medicine_id (matches the original app's /api/cart/items/:productId contract). */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const gate = await requireRole(ROLE_GROUPS.ANY_AUTHENTICATED);
  if (!gate.ok) return gate.response;

  const body = await request.json();
  const qty = Math.max(1, Number(body.qty) || 1);

  await pool.query<ResultSetHeader>(
    "UPDATE cart_items SET qty = :qty WHERE user_id = :userId AND medicine_id = :medicineId",
    { qty, userId: Number(gate.session.user.id), medicineId: Number(params.id) }
  );

  return NextResponse.json({ success: true });
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
