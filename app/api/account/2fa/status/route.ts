import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import type { RowDataPacket } from "mysql2";

export async function GET() {
  const gate = await requireRole(ROLE_GROUPS.OPERATIONAL);
  if (!gate.ok) return gate.response;

  const [[row]] = await pool.query<RowDataPacket[]>(
    "SELECT totp_enabled FROM users WHERE id = :id",
    { id: Number(gate.session.user.id) }
  );

  return NextResponse.json({ success: true, data: { enabled: Boolean(row?.totp_enabled) } });
}
