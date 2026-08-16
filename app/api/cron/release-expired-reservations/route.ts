import { NextResponse } from "next/server";
import pool from "@/config/db";
import { releaseExpiredReservations } from "@/lib/cartReservation";

export const dynamic = "force-dynamic";

/**
 * Best-effort periodic sweep of lapsed cart reservations. NOT required for
 * correctness — every real stock check (add-to-cart, checkout, POS/portal
 * sale) already self-heals by calling releaseExpiredReservations() scoped to
 * the product in question before it trusts reserved_qty, so a hold releases
 * itself the moment anyone next cares about that product's availability.
 * This route just sweeps the rest (slow-moving products nobody's touched
 * since) so medicines.reserved_qty doesn't sit looking stale in admin
 * dashboards. Safe to delete this route + its vercel.json cron entry with
 * zero functional impact on the reservation system itself.
 *
 * Vercel automatically attaches `Authorization: Bearer $CRON_SECRET` to
 * requests it fires from vercel.json's `crons` entry once CRON_SECRET is set
 * as a project env var — see https://vercel.com/docs/cron-jobs. Left unset,
 * this route stays open (fine for local `curl`/manual triggering, since
 * there's nothing sensitive here) — set CRON_SECRET before deploying if you
 * want to lock it down.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await releaseExpiredReservations(connection);
    await connection.commit();
    return NextResponse.json({ success: true });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
