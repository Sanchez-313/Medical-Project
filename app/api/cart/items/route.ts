import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import { releaseExpiredReservations, getStockSnapshot, reservationExpiry, refreshCartReservations } from "@/lib/cartReservation";
import type { RowDataPacket } from "mysql2";

export async function POST(request: Request) {
  const gate = await requireRole(ROLE_GROUPS.ANY_AUTHENTICATED);
  if (!gate.ok) return gate.response;

  const body = await request.json();
  const { product_id, qty } = body as { product_id: number; qty?: number };
  const userId = Number(gate.session.user.id);
  const addQty = Math.max(1, Number(qty) || 1);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Clear any lapsed holds on this product first, so `available` below
    // reflects reality rather than stock someone else abandoned 20 minutes
    // ago.
    await releaseExpiredReservations(connection, { medicineId: product_id });

    const stock = await getStockSnapshot(connection, product_id);
    if (!stock) {
      await connection.rollback();
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    const [[existingRow]] = await connection.query<RowDataPacket[]>(
      "SELECT qty FROM cart_items WHERE user_id = :userId AND medicine_id = :medicineId FOR UPDATE",
      { userId, medicineId: product_id }
    );
    const existingQty: number = existingRow?.qty ?? 0;

    // `available` already excludes this user's own existing reservation (it
    // was subtracted into reserved_qty when that row was created/updated),
    // so it's exactly "how much more can be added" — no separate math needed
    // to avoid double-counting this user's own hold.
    const additionalReserved = Math.min(addQty, stock.available);
    if (additionalReserved <= 0) {
      await connection.rollback();
      return NextResponse.json({ success: false, message: "This product is out of stock" }, { status: 409 });
    }

    const newQty = existingQty + additionalReserved;
    const reservedUntil = reservationExpiry();

    await connection.query(
      `INSERT INTO cart_items (user_id, medicine_id, qty, reserved_until)
       VALUES (:userId, :medicineId, :qty, :reservedUntil)
       ON DUPLICATE KEY UPDATE qty = :qty, reserved_until = :reservedUntil`,
      { userId, medicineId: product_id, qty: newQty, reservedUntil }
    );
    await connection.query("UPDATE medicines SET reserved_qty = reserved_qty + :delta WHERE id = :id", {
      delta: additionalReserved,
      id: product_id,
    });
    // Adding to the cart is a "still actively shopping" signal — extend
    // every other item's hold to match, not just this one.
    await refreshCartReservations(connection, userId, reservedUntil);

    await connection.commit();

    const message =
      additionalReserved < addQty ? `Only ${additionalReserved} more could be reserved — limited stock` : undefined;
    return NextResponse.json({ success: true, message, data: { qty: newQty, reservedUntil } }, { status: 201 });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
