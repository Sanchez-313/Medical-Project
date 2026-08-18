import { NextResponse } from "next/server";
import { rejectUnlessBot, getTelegramServiceUserId } from "@/lib/telegramBot";
import { checkRateLimit } from "@/lib/rateLimit";
import { createOrder, savePaymentProofImage } from "@/lib/orders";

// Same reasoning as app/api/support/telegram/route.ts: no session call
// here, so without this Next tries to prerender the route at build time
// and fails trying to reach the DB.
export const dynamic = "force-dynamic";

/**
 * Bot-facing checkout for the medicalbot Telegram bot — a single-item order
 * (see bot.py's order_* handlers), guest-style like /api/support/telegram:
 * there's no website login to attribute the order to, so it's inserted
 * under one shared "Telegram Bot" service account (getTelegramServiceUserId)
 * with the real Telegram identity kept on the order row itself
 * (telegram_chat_id/telegram_username) rather than requiring the customer
 * to have (or create) a real site account first.
 *
 * multipart/form-data: product_id, qty, payment_method ('kpay'|'cod'),
 * full_name, phone, city, address, chat_id, username (optional), and an
 * optional `payment_proof` image file (required for kpay — the bot
 * downloads the screenshot the customer sent as a Telegram photo message
 * and forwards those same bytes here). Reuses the exact same stock
 * locking/pricing transaction as the website checkout via lib/orders.ts —
 * only the auth and input shape differ.
 */
export async function POST(request: Request) {
  const denied = rejectUnlessBot(request);
  if (denied) return denied;

  const formData = await request.formData();

  const chatId = Number(formData.get("chat_id"));
  if (!chatId) {
    return NextResponse.json({ success: false, message: "chat_id is required" }, { status: 400 });
  }

  // Keyed by the Telegram chat, not IP — the bot server itself is one fixed
  // IP, so an IP-keyed limit would throttle every customer at once instead
  // of just whoever's actually spamming orders.
  const limited = checkRateLimit(`tg-order:${chatId}`, 5, 10 * 60_000);
  if (!limited.allowed) {
    return NextResponse.json(
      { success: false, message: "Too many orders placed — please wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  const productId = Number(formData.get("product_id"));
  const qty = Math.max(1, Number(formData.get("qty")) || 1);
  const payment_method = formData.get("payment_method") as "kpay" | "cod" | null;
  if (!productId) {
    return NextResponse.json({ success: false, message: "product_id is required" }, { status: 400 });
  }
  if (payment_method !== "kpay" && payment_method !== "cod") {
    return NextResponse.json({ success: false, message: "payment_method must be 'kpay' or 'cod'" }, { status: 400 });
  }

  const fullName = (formData.get("full_name") as string | null)?.trim();
  const phone = (formData.get("phone") as string | null)?.trim();
  const city = (formData.get("city") as string | null)?.trim();
  const address = (formData.get("address") as string | null)?.trim();
  if (!fullName || !phone || !city || !address) {
    return NextResponse.json({ success: false, message: "full_name, phone, city, and address are required" }, { status: 400 });
  }
  const username = (formData.get("username") as string | null)?.trim() || null;

  const proofFile = formData.get("payment_proof");
  if (payment_method === "kpay" && !(proofFile instanceof File)) {
    return NextResponse.json({ success: false, message: "A KBZ Pay payment screenshot is required" }, { status: 400 });
  }

  let paymentProofUrl: string | null = null;
  if (proofFile instanceof File) {
    try {
      paymentProofUrl = await savePaymentProofImage(proofFile);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save payment screenshot";
      const status = message.includes("5MB") ? 413 : 415;
      return NextResponse.json({ success: false, message }, { status });
    }
  }

  try {
    const userId = await getTelegramServiceUserId();
    const order = await createOrder({
      userId,
      paymentMethod: payment_method,
      // No email collected via chat — orders.shipping_email is NOT NULL, so
      // a synthetic per-chat placeholder fills it rather than adding an
      // extra conversational step nobody asked for.
      shipping: { fullName, email: `telegram-${chatId}@no-email.local`, phone, city, address },
      items: [{ product_id: productId, qty }],
      promoCodeInput: null,
      paymentProofUrl,
      telegramChatId: chatId,
      telegramUsername: username,
    });
    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Could not place order" },
      { status: 400 }
    );
  }
}
