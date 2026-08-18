import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

const CREATABLE_ROLES = new Set(["admin", "staff", "agent", "user"]);

/** All accounts (every role), for owner-only block/approve management. */
export async function GET(request: Request) {
  const gate = await requireRole(ROLE_GROUPS.OWNER_ONLY);
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, email, role, is_active, created_at
     FROM users
     WHERE :search IS NULL OR name LIKE CONCAT('%', :search, '%') OR email LIKE CONCAT('%', :search, '%')
     ORDER BY created_at DESC`,
    { search: search || null }
  );

  return NextResponse.json({ success: true, data: rows });
}

/**
 * Owner-provisioned account creation — the only way to get a staff/agent
 * (or a second owner) account onto the system, since public /register
 * always creates a 'user' (customer) account.
 */
export async function POST(request: Request) {
  const gate = await requireRole(ROLE_GROUPS.OWNER_ONLY);
  if (!gate.ok) return gate.response;

  const body = await request.json();
  const { name, email, password, role } = body as {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
  };

  const trimmedName = name?.trim() ?? "";
  const normalizedEmail = email?.toLowerCase().trim() ?? "";

  if (!trimmedName || !normalizedEmail || !password || password.length < 8) {
    return NextResponse.json(
      { success: false, message: "Name, email, and a password of at least 8 characters are required" },
      { status: 400 }
    );
  }
  if (!role || !CREATABLE_ROLES.has(role)) {
    return NextResponse.json({ success: false, message: "Invalid role" }, { status: 400 });
  }

  const [existing] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM users WHERE email = :email LIMIT 1",
    { email: normalizedEmail }
  );
  if (existing.length > 0) {
    return NextResponse.json({ success: false, message: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO users (name, email, password_hash, role) VALUES (:name, :email, :password_hash, :role)",
    { name: trimmedName, email: normalizedEmail, password_hash: passwordHash, role }
  );

  return NextResponse.json(
    { success: true, data: { id: result.insertId, name: trimmedName, email: normalizedEmail, role } },
    { status: 201 }
  );
}

/** Block/unblock (is_active toggle). Owner can never block their own account. */
export async function PATCH(request: Request) {
  const gate = await requireRole(ROLE_GROUPS.OWNER_ONLY);
  if (!gate.ok) return gate.response;

  const body = await request.json();
  const { id, is_active } = body as { id: number; is_active: boolean };

  if (!id) {
    return NextResponse.json({ success: false, message: "id is required" }, { status: 400 });
  }
  if (Number(id) === Number(gate.session.user.id)) {
    return NextResponse.json({ success: false, message: "You cannot block your own account" }, { status: 400 });
  }

  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE users SET is_active = :is_active WHERE id = :id",
    { is_active: is_active ? 1 : 0, id }
  );

  if (result.affectedRows === 0) {
    return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
