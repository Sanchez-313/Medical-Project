import { NextResponse } from "next/server";
import pool from "@/config/db";
import type { RowDataPacket } from "mysql2";

// No auth/session call here for Next to detect as a "dynamic API", so it
// gets silently build-time prerendered otherwise — which tries to connect
// to the DB at build time and fails on hosts (Vercel) that can't reach it.
export const dynamic = "force-dynamic";

/**
 * Public storefront listing — no auth required. Never selects cost_price_ks;
 * that stays owner-only, same isolation rule as every other product query.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category")?.trim();
  const search = searchParams.get("search")?.trim();

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, sku, category, description, image_url, selling_price_ks, stock_qty, status
     FROM medicines
     WHERE is_active = 1
       AND (:category IS NULL OR category = :category)
       AND (:search IS NULL OR name LIKE CONCAT('%', :search, '%'))
     ORDER BY name ASC`,
    { category: category || null, search: search || null }
  );

  return NextResponse.json({ success: true, data: rows });
}
