import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import type { RowDataPacket } from "mysql2";

/**
 * Checkout calls this to show the discount before placing an order, but the
 * discount actually applied is always recomputed server-side inside
 * POST /api/orders from the code alone — this response is never trusted as
 * the source of truth for the charge.
 */
export async function POST(request: Request) {
  const gate = await requireRole(ROLE_GROUPS.ANY_AUTHENTICATED);
  if (!gate.ok) return gate.response;

  const { code } = (await request.json()) as { code?: string };
  const normalizedCode = code?.trim().toUpperCase() ?? "";
  if (!normalizedCode) {
    return NextResponse.json({ success: false, message: "Enter a promo code" }, { status: 400 });
  }

  const [[promo]] = await pool.query<RowDataPacket[]>(
    "SELECT discount_percent FROM promo_codes WHERE code = :code AND is_active = 1",
    { code: normalizedCode }
  );

  if (!promo) {
    return NextResponse.json({ success: false, message: "Invalid or expired promo code" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: { code: normalizedCode, discount_percent: promo.discount_percent } });
}
