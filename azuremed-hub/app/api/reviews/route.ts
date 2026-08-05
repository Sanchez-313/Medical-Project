import { NextResponse } from "next/server";
import pool from "@/config/db";
import type { RowDataPacket } from "mysql2";

/** Public — powers the storefront Testimonials carousel. */
export async function GET() {
  const [reviews] = await pool.query<RowDataPacket[]>(
    "SELECT id, name, title, comment, rating, avatar_url FROM reviews ORDER BY created_at DESC LIMIT 12"
  );

  return NextResponse.json({ success: true, data: { reviews } });
}
