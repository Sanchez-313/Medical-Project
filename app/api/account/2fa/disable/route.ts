import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import type { RowDataPacket } from "mysql2";

/**
 * Requires the current password (not a TOTP code) to disable — a stolen
 * session cookie alone shouldn't be enough to strip 2FA off an account.
 */
export async function POST(request: Request) {
  const gate = await requireRole(ROLE_GROUPS.OPERATIONAL);
  if (!gate.ok) return gate.response;

  const { password } = (await request.json()) as { password?: string };
  if (!password) {
    return NextResponse.json({ success: false, message: "Enter your password to confirm" }, { status: 400 });
  }

  const [[row]] = await pool.query<RowDataPacket[]>(
    "SELECT password_hash FROM users WHERE id = :id",
    { id: Number(gate.session.user.id) }
  );
  const valid = row?.password_hash ? await bcrypt.compare(password, row.password_hash) : false;
  if (!valid) {
    return NextResponse.json({ success: false, message: "Incorrect password" }, { status: 400 });
  }

  await pool.query("UPDATE users SET totp_secret = NULL, totp_enabled = 0 WHERE id = :id", {
    id: Number(gate.session.user.id),
  });

  return NextResponse.json({ success: true });
}
