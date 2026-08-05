import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import { verifyTotp } from "@/lib/totp";
import type { RowDataPacket } from "mysql2";

export async function POST(request: Request) {
  const gate = await requireRole(ROLE_GROUPS.OPERATIONAL);
  if (!gate.ok) return gate.response;

  const { code } = (await request.json()) as { code?: string };
  if (!code) {
    return NextResponse.json({ success: false, message: "Enter the 6-digit code" }, { status: 400 });
  }

  const [[row]] = await pool.query<RowDataPacket[]>(
    "SELECT totp_secret FROM users WHERE id = :id",
    { id: Number(gate.session.user.id) }
  );
  if (!row?.totp_secret) {
    return NextResponse.json({ success: false, message: "Start setup again" }, { status: 400 });
  }

  if (!(await verifyTotp(code, row.totp_secret))) {
    return NextResponse.json({ success: false, message: "Incorrect code" }, { status: 400 });
  }

  await pool.query("UPDATE users SET totp_enabled = 1 WHERE id = :id", {
    id: Number(gate.session.user.id),
  });

  return NextResponse.json({ success: true });
}
