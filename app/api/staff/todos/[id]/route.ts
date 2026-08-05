import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import type { ResultSetHeader } from "mysql2";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const gate = await requireRole(ROLE_GROUPS.MANAGERIAL);
  if (!gate.ok) return gate.response;

  const { is_done } = (await request.json()) as { is_done: boolean };

  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE staff_todos SET is_done = :is_done WHERE id = :id AND user_id = :userId`,
    { is_done: is_done ? 1 : 0, id: Number(params.id), userId: Number(gate.session.user.id) }
  );

  if (result.affectedRows === 0) {
    return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const gate = await requireRole(ROLE_GROUPS.MANAGERIAL);
  if (!gate.ok) return gate.response;

  const [result] = await pool.query<ResultSetHeader>(
    `DELETE FROM staff_todos WHERE id = :id AND user_id = :userId`,
    { id: Number(params.id), userId: Number(gate.session.user.id) }
  );

  if (result.affectedRows === 0) {
    return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
