import type { PoolConnection } from "mysql2/promise";
import type { RowDataPacket } from "mysql2";

/**
 * How long an add-to-cart (or quantity bump) holds stock before the
 * reservation lapses. Refreshed on every add/update — see reserved_until on
 * cart_items in config/azuremed_schema.sql.
 */
export const RESERVATION_MINUTES = 15;

export function reservationExpiry(): Date {
  return new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000);
}

/**
 * Releases lapsed cart reservations: decrements medicines.reserved_qty by
 * the summed qty of any cart_items rows whose reserved_until has passed,
 * then deletes those rows. Called lazily — right before whatever operation
 * needs an accurate "how much is actually available" answer — rather than
 * on a fixed schedule, so correctness never depends on a cron job actually
 * firing (Vercel Hobby's cron tier is far coarser than a 15-minute hold
 * would need). A best-effort periodic sweep still exists for tidiness — see
 * app/api/cron/release-expired-reservations/route.ts — but nothing
 * functionally depends on it running on time.
 *
 * Must run inside an open transaction on `conn`; caller owns commit/rollback.
 * Pass `medicineId` to scope the release to one product (the common case:
 * about to check/reserve stock for that product) or `userId` to scope it to
 * one shopper's own cart (GET /api/cart, so their view is self-consistent
 * even if no one else has touched that product recently). Omit both for a
 * full sweep (the cron route).
 */
export async function releaseExpiredReservations(
  conn: PoolConnection,
  filter: { medicineId?: number; userId?: number } = {}
): Promise<void> {
  const conditions = ["reserved_until IS NOT NULL", "reserved_until < NOW()"];
  const params: Record<string, number> = {};
  if (filter.medicineId !== undefined) {
    conditions.push("medicine_id = :medicineId");
    params.medicineId = filter.medicineId;
  }
  if (filter.userId !== undefined) {
    conditions.push("user_id = :userId");
    params.userId = filter.userId;
  }
  const where = conditions.join(" AND ");

  const [expired] = await conn.query<RowDataPacket[]>(
    `SELECT medicine_id, SUM(qty) AS total_qty FROM cart_items WHERE ${where} GROUP BY medicine_id FOR UPDATE`,
    params
  );
  if (expired.length === 0) return;

  for (const row of expired) {
    await conn.query("UPDATE medicines SET reserved_qty = GREATEST(reserved_qty - :qty, 0) WHERE id = :id", {
      qty: row.total_qty,
      id: row.medicine_id,
    });
  }
  await conn.query(`DELETE FROM cart_items WHERE ${where}`, params);
}

export interface StockSnapshot {
  stockQty: number;
  reservedQty: number;
  /** stock_qty - reserved_qty, floored at 0 — what can actually still be reserved/sold. */
  available: number;
}

/**
 * Row-locks (FOR UPDATE) and reads one medicine's stock + reservation
 * state. Callers should run releaseExpiredReservations({ medicineId }) on
 * the same connection first, so `available` reflects any holds that just
 * lapsed rather than stale reserved_qty. Returns null for a missing or
 * inactive product.
 */
export async function getStockSnapshot(conn: PoolConnection, medicineId: number): Promise<StockSnapshot | null> {
  const [[medicine]] = await conn.query<RowDataPacket[]>(
    "SELECT stock_qty, reserved_qty FROM medicines WHERE id = :id AND is_active = 1 FOR UPDATE",
    { id: medicineId }
  );
  if (!medicine) return null;
  return {
    stockQty: medicine.stock_qty,
    reservedQty: medicine.reserved_qty,
    available: Math.max(medicine.stock_qty - medicine.reserved_qty, 0),
  };
}
