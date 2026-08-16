import { NextResponse } from "next/server";
import pool from "@/config/db";
import type { RowDataPacket } from "mysql2";

// No auth/session call here for Next to detect as a "dynamic API", so it
// gets silently build-time prerendered otherwise — which tries to connect
// to the DB at build time and fails on hosts (Vercel) that can't reach it.
export const dynamic = "force-dynamic";

/** Public — powers the storefront home page's ad slideshow. Active slides only, in Admin-set order. */
export async function GET() {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, title, description, title_my, description_my, image_url, link_url FROM advertisements WHERE is_active = 1 ORDER BY sort_order ASC, created_at DESC"
  );
  return NextResponse.json({ success: true, data: rows });
}
