import bcrypt from "bcryptjs";
import crypto from "crypto";
import pool from "@/config/db";
import type { RowDataPacket } from "mysql2";

const SERVICE_EMAIL = "telegram-bot@system.local";

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
