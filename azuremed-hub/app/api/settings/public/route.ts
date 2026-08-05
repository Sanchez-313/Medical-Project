import { NextResponse } from "next/server";
import pool from "@/config/db";
import type { RowDataPacket } from "mysql2";

// No auth/session call here for Next to detect as a "dynamic API", so it
// gets silently build-time prerendered otherwise — which tries to connect
// to the DB at build time and fails on hosts (Vercel) that can't reach it.
export const dynamic = "force-dynamic";

/** Only the fields checkout actually needs to display — never the whole settings row. No auth required: the delivery fee is public storefront info. */
export async function GET() {
  const [[settings]] = await pool.query<RowDataPacket[]>("SELECT delivery_fee_ks FROM store_settings WHERE id = 1");
  return NextResponse.json({ success: true, data: { delivery_fee_ks: settings?.delivery_fee_ks ?? 0 } });
}
