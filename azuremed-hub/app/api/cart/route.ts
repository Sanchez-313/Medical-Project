import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import { releaseExpiredReservations } from "@/lib/cartReservation";
import type { RowDataPacket } from "mysql2";

/** Storefront cart — any authenticated account (customers use this; staff/owner just for testing). */
export async function GET() {
  const gate = await requireRole(ROLE_GROUPS.ANY_AUTHENTICATED);
  if (!gate.ok) return gate.response;

  const userId = Number(gate.session.user.id);

  // Release this user's own lapsed holds before reading their cart, so a
  // page refresh reflects reality even if no one else's add/checkout
  // happened to trigger cleanup on the affected products in the meantime.
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await releaseExpiredReservations(connection, { userId });
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const [items] = await pool.query<RowDataPacket[]>(
    `SELECT c.id, c.medicine_id AS medicineId, c.qty AS quantity, c.reserved_until AS reservedUntil,
            m.name, m.category, m.image_url, m.selling_price_ks AS price, m.stock_qty, m.reserved_qty
     FROM cart_items c
     JOIN medicines m ON m.id = c.medicine_id
     WHERE c.user_id = :userId
     ORDER BY c.created_at ASC`,
    { userId }
  );

  return NextResponse.json({ success: true, data: { items } });
}

export async function DELETE() {
  const gate = await requireRole(ROLE_GROUPS.ANY_AUTHENTICATED);
  if (!gate.ok) return gate.response;

  const userId = Number(gate.session.user.id);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [items] = await connection.query<RowDataPacket[]>(
      "SELECT medicine_id, qty FROM cart_items WHERE user_id = :userId FOR UPDATE",
      { userId }
    );
    for (const item of items) {
      await connection.query("UPDATE medicines SET reserved_qty = GREATEST(reserved_qty - :qty, 0) WHERE id = :id", {
        qty: item.qty,
        id: item.medicine_id,
      });
    }
    await connection.query("DELETE FROM cart_items WHERE user_id = :userId", { userId });

    await connection.commit();
    return NextResponse.json({ success: true });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
