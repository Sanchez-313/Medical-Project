import { NextResponse } from "next/server";
import pool from "@/config/db";
import { rejectUnlessBot } from "@/lib/telegramBot";
import { sendTelegramMessage } from "@/lib/telegramNotify";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const dynamic = "force-dynamic";

/**
 * Lets an admin/staff account answer a customer_queries row from Telegram
 * instead of opening /staff/queries. The bot posts here after: staff taps
 * the "✍️ Reply" button on a "new question" alert (route.ts), then types
 * their answer as a normal message — same tap-then-type pattern the bot
 * already uses for search/ask-a-question, not a reply-to-message gesture
 * (that was the original design here and it was confusing to actually use).
 *
 * rejectUnlessBot() only proves the request came from *some* copy of the
 * medicalbot process — it does NOT prove the Telegram user who tapped
 * "Reply" is actually staff. That's a second, separate check below: the
 * replying telegram_user_id must match a users row with telegram_chat_id
 * set AND role admin/staff. Skipping that check would let anyone who ever
 * DMs the bot forge answers into a real support inbox by guessing a
 * ticket_id.
 */
export async function POST(request: Request) {
  const denied = rejectUnlessBot(request);
  if (denied) return denied;

  const { ticket_id, telegram_user_id, staff_response } = (await request.json()) as {
    ticket_id?: number;
    telegram_user_id?: number;
    staff_response?: string;
  };

  const ticketId = Number(ticket_id);
  const staffTelegramId = Number(telegram_user_id);
  const trimmedResponse = staff_response?.trim();

  if (!ticketId || !staffTelegramId) {
    return NextResponse.json({ success: false, message: "ticket_id and telegram_user_id are required" }, { status: 400 });
  }
  if (!trimmedResponse) {
    return NextResponse.json({ success: false, message: "staff_response is required" }, { status: 400 });
  }

  const [[staffUser]] = await pool.query<RowDataPacket[]>(
    `SELECT id, name FROM users
     WHERE telegram_chat_id = :chatId AND role IN ('admin', 'staff') AND is_active = 1 LIMIT 1`,
    { chatId: staffTelegramId }
  );
  if (!staffUser) {
    return NextResponse.json(
      { success: false, message: "This Telegram account isn't linked to a staff/admin login" },
      { status: 403 }
    );
  }

  const [[ticket]] = await pool.query<RowDataPacket[]>(
    `SELECT id, telegram_chat_id, status FROM customer_queries WHERE id = :ticketId LIMIT 1`,
    { ticketId }
  );
  if (!ticket) {
    return NextResponse.json({ success: false, message: "Ticket not found" }, { status: 404 });
  }
  if (ticket.status === "closed") {
    return NextResponse.json({ success: false, message: "This ticket is already closed" }, { status: 400 });
  }

  await pool.query<ResultSetHeader>(
    `UPDATE customer_queries
     SET staff_response = :staff_response, status = 'answered', responded_by = :responded_by, responded_at = NOW()
     WHERE id = :id`,
    { staff_response: trimmedResponse, responded_by: staffUser.id, id: ticket.id }
  );

  // Best-effort — same reasoning as the "new question" notify in
  // route.ts: a failed push here doesn't undo the answer that's already
  // saved, the customer can still see it via the bot's "My tickets".
  if (ticket.telegram_chat_id) {
    await sendTelegramMessage(
      ticket.telegram_chat_id,
      `✅ Ticket #${ticket.id} ကို ဖြေကြားပြီးပါပြီ\n\n${trimmedResponse}`
    );
  }

  return NextResponse.json({ success: true, data: { id: ticket.id } });
}
