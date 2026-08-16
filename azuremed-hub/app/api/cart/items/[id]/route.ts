import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import { releaseExpiredReservations, getStockSnapshot, reservationExpiry } from "@/lib/cartReservation";
import type { RowDataPacket } from "mysql2";

/** [id] here is the medicine_id (matches the original app's /api/cart/items/:productId contract). */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const gate = await requireRole(ROLE_GROUPS.ANY_AUTHENTICATED);
  if (!gate.ok) return gate.response;

  const body = await request.json();
  const requestedQty = Math.max(1, Number(body.qty) || 1);
  const medicineId = Number(params.id);
  const userId = Number(gate.session.user.id);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await releaseExpiredReservations(connection, { medicineId });

    const stock = await getStockSnapshot(connection, medicineId);
    if (!stock) {
      await connection.rollback();
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    const [[cartRow]] = await connection.query<RowDataPacket[]>(
      "SELECT qty FROM cart_items WHERE user_id = :userId AND medicine_id = :medicineId FOR UPDATE",
      { userId, medicineId }
    );
    const existingQty: number = cartRow?.qty ?? 0;

    // This row's own existing qty is already reserved (part of reserved_qty,
    // so already subtracted out of `available`) — the ceiling this qty can
    // rise to is what's already held here plus whatever's still free.
    const maxQty = existingQty + stock.available;
    const finalQty = Math.min(requestedQty, maxQty);

    if (finalQty <= 0) {
      // Reservation lapsed and nothing's free to re-reserve — drop the row
      // rather than leave a zero-qty cart item behind.
      if (cartRow) {
        await connection.query("DELETE FROM cart_items WHERE user_id = :userId AND medicine_id = :medicineId", {
          userId,
          medicineId,
        });
      }
      await connection.commit();
      return NextResponse.json({ success: false, message: "This product is out of stock" }, { status: 409 });
    }

    const delta = finalQty - existingQty;
    const reservedUntil = reservationExpiry();

    if (cartRow) {
      await connection.query(
        "UPDATE cart_items SET qty = :qty, reserved_until = :reservedUntil WHERE user_id = :userId AND medicine_id = :medicineId",
        { qty: finalQty, reservedUntil, userId, medicineId }
      );
    } else {
      await connection.query(
        "INSERT INTO cart_items (user_id, medicine_id, qty, reserved_until) VALUES (:userId, :medicineId, :qty, :reservedUntil)",
        { userId, medicineId, qty: finalQty, reservedUntil }
      );
    }
    if (delta !== 0) {
      await connection.query("UPDATE medicines SET reserved_qty = GREATEST(reserved_qty + :delta, 0) WHERE id = :id", {
        delta,
        id: medicineId,
      });
    }

    await connection.commit();
    return NextResponse.json({ success: true, data: { qty: finalQty, reservedUntil } });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const gate = await requireRole(ROLE_GROUPS.ANY_AUTHENTICATED);
  if (!gate.ok) return gate.response;

  const userId = Number(gate.session.user.id);
  const medicineId = Number(params.id);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [[cartRow]] = await connection.query<RowDataPacket[]>(
      "SELECT qty FROM cart_items WHERE user_id = :userId AND medicine_id = :medicineId FOR UPDATE",
      { userId, medicineId }
    );

    if (cartRow) {
      await connection.query("UPDATE medicines SET reserved_qty = GREATEST(reserved_qty - :qty, 0) WHERE id = :id", {
        qty: cartRow.qty,
        id: medicineId,
      });
      await connection.query("DELETE FROM cart_items WHERE user_id = :userId AND medicine_id = :medicineId", {
        userId,
        medicineId,
      });
    }

    await connection.commit();
    return NextResponse.json({ success: true });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
