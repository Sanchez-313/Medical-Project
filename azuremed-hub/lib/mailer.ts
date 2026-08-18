import nodemailer from "nodemailer";

/**
 * Generic SMTP transport for transactional email (currently: password
 * reset). Works with any SMTP provider — Gmail (with an app password),
 * Resend, SendGrid, Mailgun, etc. — since they all speak SMTP. If the env
 * vars aren't set, getTransport() returns null and callers fall back to
 * logging the email to the server console instead of silently pretending
 * to send it.
 */
let cachedTransport: ReturnType<typeof nodemailer.createTransport> | null | undefined;

function getTransport() {
  if (cachedTransport !== undefined) return cachedTransport;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    cachedTransport = null;
    return cachedTransport;
  }

  cachedTransport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return cachedTransport;
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const transport = getTransport();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@azuremedhub.com";

  const subject = "Reset your AzureMed Hub password";
  const text = `We received a request to reset your AzureMed Hub password.\n\nReset it here (expires in 30 minutes):\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`;
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#1d4ed8;">Reset your password</h2>
      <p>We received a request to reset your AzureMed Hub password.</p>
      <p><a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Reset Password</a></p>
      <p style="color:#64748b;font-size:13px;">This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.</p>
    </div>`;

  if (!transport) {
    // No SMTP configured — log instead of pretending the email went out, so
    // dev/local setups still work end-to-end without real credentials. The
    // forgot-password page also surfaces this same link on-screen (see
    // app/api/auth/forgot-password/route.ts's dev_reset_url) — this console
    // banner is the fallback for any other caller of this function.
    console.warn(
      [
        "",
        "==================== [mailer] SMTP not configured ====================",
        `Password reset link for ${to}:`,
        resetUrl,
        "========================================================================",
        "",
      ].join("\n")
    );
    return;
  }

  await transport.sendMail({ from, to, subject, text, html });
}
