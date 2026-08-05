import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

/** A customer's own submitted queries and any Staff/Owner response. */
export async function GET() {
  const gate = await requireRole(ROLE_GROUPS.ANY_AUTHENTICATED);
  if (!gate.ok) return gate.response;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, subject, message, status, staff_response, responded_at, created_at
     FROM customer_queries WHERE user_id = :userId ORDER BY created_at DESC`,
    { userId: Number(gate.session.user.id) }
  );

  return NextResponse.json({ success: true, data: rows });
}

/** Submit a new support query. */
export async function POST(request: Request) {
  const gate = await requireRole(ROLE_GROUPS.ANY_AUTHENTICATED);
  if (!gate.ok) return gate.response;

  const { subject, message } = (await request.json()) as { subject?: string; message?: string };
  const trimmedSubject = subject?.trim() ?? "";
  const trimmedMessage = message?.trim() ?? "";

  if (!trimmedSubject || !trimmedMessage) {
    return NextResponse.json({ success: false, message: "Subject and message are required" }, { status: 400 });
  }

  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO customer_queries (user_id, subject, message) VALUES (:user_id, :subject, :message)",
    { user_id: Number(gate.session.user.id), subject: trimmedSubject, message: trimmedMessage }
  );

  return NextResponse.json({ success: true, data: { id: result.insertId } }, { status: 201 });
}
