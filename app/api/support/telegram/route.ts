import { NextResponse } from "next/server";
import pool from "@/config/db";
import { checkRateLimit } from "@/lib/rateLimit";
import { getTelegramServiceUserId } from "@/lib/telegramBot";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

// Same reasoning as app/api/products/route.ts: no session call here, so
// without this Next tries to prerender the route at build time and fails
// trying to reach the DB.
export const dynamic = "force-dynamic";

/**
 * Bot-facing bridge for the medicalbot Telegram bot (the storefront's
 * "Need Help?" widget — see components/NeedHelpButton.tsx — opens that bot).
 * There's no browser session here, so this isn't gated by requireRole()
 * like every other /api/support and /api/staff route — instead every
 * request must carry the shared BOT_API_SECRET the bot process holds in its
 * own .env. Never routed through middleware.ts (only /api/admin, /api/staff,
 * /api/portal are), so that header check is the only gate — keep it first
 * in both handlers.
 */
function rejectUnlessBot(request: Request): NextResponse | null {
  const secret = process.env.BOT_API_SECRET;
  if (!secret) {
    return NextResponse.json({ success: false, message: "Bot integration not configured" }, { status: 503 });
  }
  if (request.headers.get("x-bot-secret") !== secret) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/** Bot calls this to submit a new support question on behalf of a Telegram user. */
export async function POST(request: Request) {
  const denied = rejectUnlessBot(request);
  if (denied) return denied;

  const { subject, message, chat_id, username } = (await request.json()) as {
    subject?: string;
    message?: string;
    chat_id?: number;
    username?: string;
  };

  const chatId = Number(chat_id);
  if (!chatId) {
    return NextResponse.json({ success: false, message: "chat_id is required" }, { status: 400 });
  }
  const trimmedMessage = message?.trim();
  if (!trimmedMessage) {
    return NextResponse.json({ success: false, message: "message is required" }, { status: 400 });
  }
  const trimmedSubject = subject?.trim().slice(0, 255) || trimmedMessage.slice(0, 80);

  // Keyed by the Telegram chat, not IP — the bot server itself is one fixed
  // IP, so an IP-keyed limit would throttle every user at once instead of
  // just whoever's actually spamming.
  const limited = checkRateLimit(`tg-support:${chatId}`, 5, 10 * 60_000);
  if (!limited.allowed) {
    return NextResponse.json(
      { success: false, message: "Too many requests — please wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  const userId = await getTelegramServiceUserId();
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO customer_queries (user_id, subject, message, telegram_chat_id, telegram_username)
     VALUES (:user_id, :subject, :message, :chat_id, :username)`,
    { user_id: userId, subject: trimmedSubject, message: trimmedMessage, chat_id: chatId, username: username?.trim() || null }
  );

  return NextResponse.json({ success: true, data: { id: result.insertId } }, { status: 201 });
}

/** Bot calls this to show a Telegram user their own ticket history/status. */
export async function GET(request: Request) {
  const denied = rejectUnlessBot(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const chatId = Number(searchParams.get("chat_id"));
  if (!chatId) {
    return NextResponse.json({ success: false, message: "chat_id is required" }, { status: 400 });
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, subject, status, staff_response, responded_at, created_at
     FROM customer_queries WHERE telegram_chat_id = :chatId ORDER BY created_at DESC LIMIT 10`,
    { chatId }
  );

  return NextResponse.json({ success: true, data: rows });
}
