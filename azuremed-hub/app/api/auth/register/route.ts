import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/config/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

/**
 * Public self-registration. Always creates a 'user' (customer) account —
 * owner/staff/agent accounts are provisioned separately (seed script /
 * owner-created), never through this open endpoint.
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { firstName, lastName, email, password } = body as {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
  };

  const name = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  const normalizedEmail = email?.toLowerCase().trim() ?? "";

  if (!name || !normalizedEmail || !password || password.length < 8) {
    return NextResponse.json(
      { success: false, message: "Name, email, and a password of at least 8 characters are required" },
      { status: 400 }
    );
  }

  const [existing] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM users WHERE email = :email LIMIT 1",
    { email: normalizedEmail }
  );
  if (existing.length > 0) {
    return NextResponse.json({ success: false, message: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await pool.query<ResultSetHeader>(
    "INSERT INTO users (name, email, password_hash, role) VALUES (:name, :email, :password_hash, 'user')",
    { name, email: normalizedEmail, password_hash: passwordHash }
  );

  return NextResponse.json({ success: true }, { status: 201 });
}
