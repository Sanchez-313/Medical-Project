import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

// No auth/session call here for Next to detect as a "dynamic API", so it
// gets silently build-time prerendered otherwise — which tries to connect
// to the DB at build time and fails on hosts (Vercel) that can't reach it.
export const dynamic = "force-dynamic";

/** Public — powers the storefront Testimonials carousel. */
export async function GET() {
  const [reviews] = await pool.query<RowDataPacket[]>(
    "SELECT id, name, title, comment, rating, avatar_url FROM reviews ORDER BY created_at DESC LIMIT 12"
  );

  return NextResponse.json({ success: true, data: { reviews } });
}

/**
 * Submit or edit your own testimonial — only if you've actually placed a
 * real (non-cancelled) order. Not tied to a specific product like
 * product_reviews; this is the general "what customers say" carousel, so
 * the gate is "have you ever bought anything here" rather than "did you buy
 * this exact item". One testimonial per customer (uq_reviews_user);
 * resubmitting updates it instead of adding a duplicate.
 */
export async function POST(request: Request) {
  const gate = await requireRole(ROLE_GROUPS.ANY_AUTHENTICATED);
  if (!gate.ok) return gate.response;

  const userId = Number(gate.session.user.id);
  const { title, comment, rating } = (await request.json()) as {
    title?: string;
    comment?: string;
    rating: number;
  };

  if (!comment?.trim()) {
    return NextResponse.json({ success: false, message: "Please write a comment" }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ success: false, message: "rating must be an integer 1-5" }, { status: 400 });
  }

  const [[purchase]] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM orders WHERE user_id = :userId AND status <> 'cancelled' LIMIT 1`,
    { userId }
  );
  if (!purchase) {
    return NextResponse.json(
      { success: false, message: "Only customers who have placed an order can leave a testimonial" },
      { status: 403 }
    );
  }

  await pool.query<ResultSetHeader>(
    `INSERT INTO reviews (user_id, name, title, comment, rating)
     VALUES (:userId, :name, :title, :comment, :rating)
     ON DUPLICATE KEY UPDATE name = VALUES(name), title = VALUES(title), comment = VALUES(comment), rating = VALUES(rating)`,
    {
      userId,
      name: gate.session.user.name ?? "Customer",
      title: title?.trim() || null,
      comment: comment.trim(),
      rating,
    }
  );

  return NextResponse.json({ success: true }, { status: 201 });
}
