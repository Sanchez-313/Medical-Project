import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextResponse } from "next/server";
import pool from "@/config/db";
import type { RowDataPacket } from "mysql2";

const SERVICE_EMAIL = "telegram-bot@system.local";

/**
 * Shared gate for every bot-facing route under app/api/support/telegram/**.
 * None of these have a browser session to check (there's no requireRole()
 * call), so the medicalbot process authenticates with a secret shared only
 * between its own .env and this server's .env — see BOT_API_SECRET in both.
 * These routes are never covered by middleware.ts (only /api/admin,
 * /api/staff, /api/portal are), so this check is the only gate: call it
 * first, before touching the request body or the database.
 */
export function rejectUnlessBot(request: Request): NextResponse | null {
  const secret = process.env.BOT_API_SECRET;
  if (!secret) {
    return NextResponse.json({ success: false, message: "Bot integration not configured" }, { status: 503 });
  }
  if (request.headers.get("x-bot-secret") !== secret) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/**
 * `customer_queries.user_id` is a NOT NULL FK into `users` — but a Telegram
 * support request has no website login to attribute it to. Rather than
 * loosen that constraint (and risk orphaned/anonymous rows drifting into
 * other queries that join `users`), every Telegram-submitted query is
 * attributed to one shared "Telegram Bot" service account. It's created
 * with `is_active = 0` and a random password never handed to anyone, so it
 * structurally can never sign in through /login even if the row were
 * somehow discovered. The real asker's identity lives in
 * `telegram_chat_id`/`telegram_username` on the query row itself (see
 * app/api/support/telegram/route.ts), not on this shared user.
 *
 * Created lazily on first use rather than via scripts/seed.js, so there's no
 * ordering dependency between "run the seed script" and "the bot's first
 * support request" — whichever happens first just works.
 */
export async function getTelegramServiceUserId(): Promise<number> {
  const [existing] = await pool.query<RowDataPacket[]>("SELECT id FROM users WHERE email = :email LIMIT 1", {
    email: SERVICE_EMAIL,
  });
  if (existing[0]) return existing[0].id;

  const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role, is_active)
     VALUES ('Telegram Bot', :email, :password_hash, 'user', 0)
     ON DUPLICATE KEY UPDATE name = name`,
    { email: SERVICE_EMAIL, password_hash: passwordHash }
  );

  const [rows] = await pool.query<RowDataPacket[]>("SELECT id FROM users WHERE email = :email LIMIT 1", {
    email: SERVICE_EMAIL,
  });
  return rows[0].id;
}
