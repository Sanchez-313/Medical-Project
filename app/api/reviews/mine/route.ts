import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import type { RowDataPacket } from "mysql2";

// No auth/session call here for Next to detect as a "dynamic API", so it
// gets silently build-time prerendered otherwise — which tries to connect
// to the DB at build time and fails on hosts (Vercel) that can't reach it.
export const dynamic = "force-dynamic";

/**
 * The signed-in user's own homepage testimonial, if they've already left
 * one — reviews.uq_reviews_user caps it at one per customer (see
 * app/api/reviews/route.ts POST), so TestimonialForm uses this to pre-fill
 * and switch into "editing" mode instead of silently overwriting whatever
 * they submit next with no explanation.
 */
export async function GET() {
  const gate = await requireRole(ROLE_GROUPS.ANY_AUTHENTICATED);
  if (!gate.ok) return gate.response;

  const userId = Number(gate.session.user.id);
  const [[review]] = await pool.query<RowDataPacket[]>(
    "SELECT title, comment, rating FROM reviews WHERE user_id = :userId",
    { userId }
  );

  return NextResponse.json({ success: true, data: review ?? null });
}
