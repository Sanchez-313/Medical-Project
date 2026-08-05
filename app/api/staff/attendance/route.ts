import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

/** Today's check-in/out status plus the last 7 days, for the signed-in user only. */
export async function GET() {
  const gate = await requireRole(ROLE_GROUPS.MANAGERIAL);
  if (!gate.ok) return gate.response;

  const userId = Number(gate.session.user.id);

  const [[today]] = await pool.query<RowDataPacket[]>(
    `SELECT id, work_date, check_in_at, check_out_at FROM staff_attendance
     WHERE user_id = :userId AND work_date = CURDATE()`,
    { userId }
  );
  const [recent] = await pool.query<RowDataPacket[]>(
    `SELECT work_date, check_in_at, check_out_at FROM staff_attendance
     WHERE user_id = :userId ORDER BY work_date DESC LIMIT 7`,
    { userId }
  );

  return NextResponse.json({ success: true, data: { today: today ?? null, recent } });
}

/** Check in for today. One check-in per calendar day. */
export async function POST() {
  const gate = await requireRole(ROLE_GROUPS.MANAGERIAL);
  if (!gate.ok) return gate.response;

  const userId = Number(gate.session.user.id);

  const [[existing]] = await pool.query<RowDataPacket[]>(
    `SELECT id, check_in_at FROM staff_attendance WHERE user_id = :userId AND work_date = CURDATE()`,
    { userId }
  );
  if (existing?.check_in_at) {
    return NextResponse.json({ success: false, message: "Already checked in today" }, { status: 400 });
  }

  await pool.query<ResultSetHeader>(
    `INSERT INTO staff_attendance (user_id, work_date, check_in_at) VALUES (:userId, CURDATE(), NOW())
     ON DUPLICATE KEY UPDATE check_in_at = NOW()`,
    { userId }
  );

  return NextResponse.json({ success: true });
}

/** Check out for today. Must have checked in first, and not already checked out. */
export async function PATCH() {
  const gate = await requireRole(ROLE_GROUPS.MANAGERIAL);
  if (!gate.ok) return gate.response;

  const userId = Number(gate.session.user.id);

  const [[existing]] = await pool.query<RowDataPacket[]>(
    `SELECT id, check_in_at, check_out_at FROM staff_attendance WHERE user_id = :userId AND work_date = CURDATE()`,
    { userId }
  );
  if (!existing?.check_in_at) {
    return NextResponse.json({ success: false, message: "Check in before checking out" }, { status: 400 });
  }
  if (existing.check_out_at) {
    return NextResponse.json({ success: false, message: "Already checked out today" }, { status: 400 });
  }

  await pool.query<ResultSetHeader>(
    `UPDATE staff_attendance SET check_out_at = NOW() WHERE id = :id`,
    { id: existing.id }
  );

  return NextResponse.json({ success: true });
}
