const TELEGRAM_API_BASE = "https://api.telegram.org";

/**
 * Sends a message to a Telegram chat via the Bot API, using the same bot
 * account as ../Telegram-bot/medicalbot (BOT_TOKEN must match that bot's
 * own .env). Used to alert a linked staff/admin account of a new question
 * (app/api/support/telegram/route.ts) and to push the answer back to the
 * customer who asked (app/api/support/telegram/answer/route.ts).
 *
 * Deliberately plain text, no parse_mode — every caller here embeds
 * unsanitized user-typed content (a customer's question, a staff member's
 * reply), and Telegram's legacy Markdown parser hard-fails the whole
 * message on a single stray `_`/`*`/`` ` ``/`[` in that text ("can't parse
 * entities"). Losing bold ticket numbers is a small price for messages
 * that reliably arrive regardless of what anyone typed.
 *
 * Best-effort: logs and returns null on any failure rather than throwing —
 * a Telegram/network hiccup shouldn't break ticket submission or answering
 * itself, since /staff/queries and the bot's "My tickets" poll always work
 * as a fallback even if a push notification never arrives.
 */
export async function sendTelegramMessage(
  chatId: number,
  text: string,
  // Optional inline keyboard — e.g. the "✍️ Reply" button on a new-question
  // alert (app/api/support/telegram/route.ts) that starts the bot's
  // tap-then-type answer flow, the same interaction pattern the bot already
  // uses for search/ask-a-question.
  replyMarkup?: { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> }
): Promise<{ message_id: number } | null> {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    console.warn("[telegramNotify] BOT_TOKEN not set — skipping Telegram push");
    return null;
  }

  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, reply_markup: replyMarkup }),
    });
    const data = await res.json();
    if (!data.ok) {
      console.warn("[telegramNotify] sendMessage failed:", data.description);
      return null;
    }
    return { message_id: data.result.message_id };
  } catch (error) {
    console.warn("[telegramNotify] sendMessage threw:", error);
    return null;
  }
}
