import { NextResponse } from "next/server";
import pool from "@/config/db";
import type { RowDataPacket } from "mysql2";

// No auth/session call here for Next to detect as a "dynamic API", so it
// gets silently build-time prerendered otherwise — which tries to connect
// to the DB at build time and fails on hosts (Vercel) that can't reach it.
export const dynamic = "force-dynamic";

/** Public — powers the storefront Testimonials carousel. */
export async function GET() {
  const [reviews] = await pool.query<RowDataPacket[]>(
    "SELECT id, name, title, comment, rating, avatar_url FROM reviews ORDER BY created_at DESC LIMIT 12"
  );

  return NextResponse.json({ success: true, data: { reviews } });
}
