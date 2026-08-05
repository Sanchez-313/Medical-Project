import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

/** Personal daily task list — always scoped to the signed-in user, never another staff member's. */
export async function GET() {
  const gate = await requireRole(ROLE_GROUPS.MANAGERIAL);
  if (!gate.ok) return gate.response;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, task, is_done, created_at FROM staff_todos WHERE user_id = :userId ORDER BY is_done ASC, created_at ASC`,
    { userId: Number(gate.session.user.id) }
  );

  return NextResponse.json({ success: true, data: rows });
}

export async function POST(request: Request) {
  const gate = await requireRole(ROLE_GROUPS.MANAGERIAL);
  if (!gate.ok) return gate.response;

  const { task } = (await request.json()) as { task?: string };
  if (!task?.trim()) {
    return NextResponse.json({ success: false, message: "task text is required" }, { status: 400 });
  }

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO staff_todos (user_id, task) VALUES (:userId, :task)`,
    { userId: Number(gate.session.user.id), task: task.trim() }
  );

  return NextResponse.json(
    { success: true, data: { id: result.insertId, task: task.trim(), is_done: 0 } },
    { status: 201 }
  );
}
