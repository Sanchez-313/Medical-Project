import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

/** Storefront cart — any authenticated account (customers use this; staff/owner just for testing). */
export async function GET() {
  const gate = await requireRole(ROLE_GROUPS.ANY_AUTHENTICATED);
  if (!gate.ok) return gate.response;

  const [items] = await pool.query<RowDataPacket[]>(
    `SELECT c.id, c.medicine_id AS medicineId, c.qty AS quantity,
            m.name, m.category, m.image_url, m.selling_price_ks AS price, m.stock_qty
     FROM cart_items c
     JOIN medicines m ON m.id = c.medicine_id
     WHERE c.user_id = :userId
     ORDER BY c.created_at ASC`,
    { userId: Number(gate.session.user.id) }
  );

  return NextResponse.json({ success: true, data: { items } });
}

export async function DELETE() {
  const gate = await requireRole(ROLE_GROUPS.ANY_AUTHENTICATED);
  if (!gate.ok) return gate.response;

  await pool.query<ResultSetHeader>("DELETE FROM cart_items WHERE user_id = :userId", {
    userId: Number(gate.session.user.id),
  });

  return NextResponse.json({ success: true });
}
