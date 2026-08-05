import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import type { ResultSetHeader } from "mysql2";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const gate = await requireRole(ROLE_GROUPS.OWNER_ONLY);
  if (!gate.ok) return gate.response;

  const { is_active } = (await request.json()) as { is_active: boolean };

  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE promo_codes SET is_active = :is_active WHERE id = :id",
    { is_active: is_active ? 1 : 0, id: Number(params.id) }
  );
  if (result.affectedRows === 0) {
    return NextResponse.json({ success: false, message: "Promo code not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const gate = await requireRole(ROLE_GROUPS.OWNER_ONLY);
  if (!gate.ok) return gate.response;

  const [result] = await pool.query<ResultSetHeader>("DELETE FROM promo_codes WHERE id = :id", {
    id: Number(params.id),
  });
  if (result.affectedRows === 0) {
    return NextResponse.json({ success: false, message: "Promo code not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
