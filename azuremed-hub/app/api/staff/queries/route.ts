import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

/** "Handle Customer Queries" — Staff/Owner side: every customer's submitted question, newest first. */
export async function GET() {
  const gate = await requireRole(ROLE_GROUPS.MANAGERIAL);
  if (!gate.ok) return gate.response;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT q.id, q.subject, q.message, q.status, q.staff_response, q.responded_at, q.created_at,
            u.name AS customer_name, u.email AS customer_email
     FROM customer_queries q
     JOIN users u ON u.id = q.user_id
     ORDER BY (q.status = 'open') DESC, q.created_at DESC
     LIMIT 100`
  );

  return NextResponse.json({ success: true, data: rows });
}

/** Respond to a query — sets it to 'answered' and records who responded. */
export async function PATCH(request: Request) {
  const gate = await requireRole(ROLE_GROUPS.MANAGERIAL);
  if (!gate.ok) return gate.response;

  const { id, staff_response, status } = (await request.json()) as {
    id?: number;
    staff_response?: string;
    status?: "answered" | "closed";
  };

  if (!id) {
    return NextResponse.json({ success: false, message: "id is required" }, { status: 400 });
  }

  if (staff_response !== undefined) {
    if (!staff_response.trim()) {
      return NextResponse.json({ success: false, message: "Response cannot be empty" }, { status: 400 });
    }
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE customer_queries
       SET staff_response = :staff_response, status = 'answered', responded_by = :responded_by, responded_at = NOW()
       WHERE id = :id`,
      { staff_response: staff_response.trim(), responded_by: Number(gate.session.user.id), id }
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: "Query not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  }

  if (status === "closed") {
    const [result] = await pool.query<ResultSetHeader>(
      "UPDATE customer_queries SET status = 'closed' WHERE id = :id",
      { id }
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: "Query not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, message: "staff_response or status is required" }, { status: 400 });
}
