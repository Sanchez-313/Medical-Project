import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/config/db";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { validatePasswordStrength } from "@/lib/passwordRules";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

/**
 * Public self-registration. Always creates a 'user' (customer) account —
 * owner/staff/agent accounts are provisioned separately (seed script /
 * owner-created), never through this open endpoint.
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { firstName, lastName, email, password, recaptchaToken } = body as {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    recaptchaToken?: string;
  };

  const name = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  const normalizedEmail = email?.toLowerCase().trim() ?? "";

  if (!name || !normalizedEmail) {
    return NextResponse.json({ success: false, message: "Name and email are required" }, { status: 400 });
  }
  const passwordError = validatePasswordStrength(password ?? "");
  if (passwordError || !password) {
    return NextResponse.json({ success: false, message: passwordError ?? "Password is required" }, { status: 400 });
  }

  const recaptcha = await verifyRecaptcha(recaptchaToken);
  if (!recaptcha.ok) {
    return NextResponse.json({ success: false, message: "Verification failed, please try again" }, { status: 400 });
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
