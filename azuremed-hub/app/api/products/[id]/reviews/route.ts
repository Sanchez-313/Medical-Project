import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

/** Public — reviews for one product, newest first, plus the aggregate rating. */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const medicineId = Number(params.id);

  const [reviews] = await pool.query<RowDataPacket[]>(
    `SELECT pr.id, pr.rating, pr.comment, pr.created_at, u.name AS reviewer_name
     FROM product_reviews pr JOIN users u ON u.id = pr.user_id
     WHERE pr.medicine_id = :medicineId
     ORDER BY pr.created_at DESC`,
    { medicineId }
  );

  const [[summary]] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS count, COALESCE(AVG(rating), 0) AS average
     FROM product_reviews WHERE medicine_id = :medicineId`,
    { medicineId }
  );

  return NextResponse.json({
    success: true,
    data: { reviews, count: Number(summary.count), average: Number(summary.average) },
  });
}

/**
 * Submit or edit your own review — only if you actually have a
 * non-cancelled order containing this medicine. One review per (user,
 * medicine); resubmitting updates it rather than creating a duplicate.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const gate = await requireRole(ROLE_GROUPS.ANY_AUTHENTICATED);
  if (!gate.ok) return gate.response;

  const medicineId = Number(params.id);
  const userId = Number(gate.session.user.id);

  const { rating, comment } = (await request.json()) as { rating: number; comment?: string };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ success: false, message: "rating must be an integer 1-5" }, { status: 400 });
  }

  const [[purchase]] = await pool.query<RowDataPacket[]>(
    `SELECT oi.id FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE o.user_id = :userId AND oi.medicine_id = :medicineId AND o.status <> 'cancelled'
     LIMIT 1`,
    { userId, medicineId }
  );
  if (!purchase) {
    return NextResponse.json(
      { success: false, message: "Only customers who have ordered this product can review it" },
      { status: 403 }
    );
  }

  await pool.query<ResultSetHeader>(
    `INSERT INTO product_reviews (medicine_id, user_id, rating, comment)
     VALUES (:medicineId, :userId, :rating, :comment)
     ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment)`,
    { medicineId, userId, rating, comment: comment?.trim() || null }
  );

  return NextResponse.json({ success: true }, { status: 201 });
}
