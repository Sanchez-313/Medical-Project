import { NextResponse } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import pool from "@/config/db";
import { validatePasswordStrength } from "@/lib/passwordRules";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export async function POST(request: Request) {
  const { token, password } = (await request.json()) as { token?: string; password?: string };

  if (!token) {
    return NextResponse.json({ success: false, message: "Reset token is required" }, { status: 400 });
  }
  const passwordError = validatePasswordStrength(password ?? "");
  if (passwordError || !password) {
    return NextResponse.json({ success: false, message: passwordError ?? "Password is required" }, { status: 400 });
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");

  const [[record]] = await pool.query<RowDataPacket[]>(
    `SELECT id, user_id FROM password_reset_tokens
     WHERE token_hash = :tokenHash AND used_at IS NULL AND expires_at > NOW()
     LIMIT 1`,
    { tokenHash }
  );

  if (!record) {
    return NextResponse.json(
      { success: false, message: "This reset link is invalid or has expired. Please request a new one." },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query<ResultSetHeader>(
      "UPDATE users SET password_hash = :passwordHash WHERE id = :userId",
      { passwordHash, userId: record.user_id }
    );
    await connection.query<ResultSetHeader>(
      "UPDATE password_reset_tokens SET used_at = NOW() WHERE id = :id",
      { id: record.id }
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return NextResponse.json({ success: true });
}
