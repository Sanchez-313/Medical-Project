import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import pool from "@/config/db";
import { sendPasswordResetEmail } from "@/lib/mailer";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

const TOKEN_TTL_MINUTES = 30;
// Always the same message regardless of whether the email exists — telling
// an anonymous caller "no account with that email" lets them enumerate
// registered emails.
const GENERIC_MESSAGE = "If an account exists for that email, a password reset link has been sent.";

export async function POST(request: Request) {
  const { email } = (await request.json()) as { email?: string };
  const normalizedEmail = email?.toLowerCase().trim();

  if (!normalizedEmail) {
    return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 });
  }

  const [[user]] = await pool.query<RowDataPacket[]>(
    "SELECT id, email FROM users WHERE email = :email AND is_active = 1 LIMIT 1",
    { email: normalizedEmail }
  );

  // Dev convenience only: when SMTP isn't configured, sendPasswordResetEmail
  // already logs the link to the server console — this additionally hands
  // it straight back in the response so the forgot-password page can show
  // it on-screen, instead of digging through terminal output. Gated to
  // non-production so a misconfigured prod deploy can never leak a reset
  // link to whoever merely typed in an email address (the exact
  // account-takeover risk a "just enter your email" reset flow would be).
  let devResetUrl: string | null = null;

  if (user) {
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    await pool.query<ResultSetHeader>(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES (:userId, :tokenHash, DATE_ADD(NOW(), INTERVAL :ttl MINUTE))`,
      { userId: user.id, tokenHash, ttl: TOKEN_TTL_MINUTES }
    );

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;
    const smtpConfigured = Boolean(
      process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS
    );
    if (!smtpConfigured && process.env.NODE_ENV !== "production") {
      devResetUrl = resetUrl;
    }
    await sendPasswordResetEmail(user.email, resetUrl);
  }

  // dev_reset_url being present/absent does technically reveal whether the
  // email is registered — the same class of enumeration issue GENERIC_MESSAGE
  // exists to avoid — but it's only ever set in local dev with no SMTP
  // configured, where that's an accepted tradeoff for convenience, not a
  // real attacker-facing surface.
  return NextResponse.json({ success: true, message: GENERIC_MESSAGE, dev_reset_url: devResetUrl });
}
