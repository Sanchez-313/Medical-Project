import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET() {
  const gate = await requireRole(ROLE_GROUPS.OWNER_ONLY);
  if (!gate.ok) return gate.response;

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, code, discount_percent, is_active, created_at FROM promo_codes ORDER BY created_at DESC"
  );

  return NextResponse.json({ success: true, data: rows });
}

export async function POST(request: Request) {
  const gate = await requireRole(ROLE_GROUPS.OWNER_ONLY);
  if (!gate.ok) return gate.response;

  const { code, discount_percent } = (await request.json()) as { code?: string; discount_percent?: number };
  const normalizedCode = code?.trim().toUpperCase() ?? "";

  if (!normalizedCode || !Number.isInteger(discount_percent) || discount_percent! < 1 || discount_percent! > 100) {
    return NextResponse.json(
      { success: false, message: "A code and a discount percent between 1 and 100 are required" },
      { status: 400 }
    );
  }

  const [existing] = await pool.query<RowDataPacket[]>("SELECT id FROM promo_codes WHERE code = :code", {
    code: normalizedCode,
  });
  if (existing.length > 0) {
    return NextResponse.json({ success: false, message: "This code already exists" }, { status: 409 });
  }

  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO promo_codes (code, discount_percent) VALUES (:code, :discount_percent)",
    { code: normalizedCode, discount_percent }
  );

  return NextResponse.json(
    { success: true, data: { id: result.insertId, code: normalizedCode, discount_percent, is_active: 1 } },
    { status: 201 }
  );
}
