import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import { generateSecret, generateQrCodeDataUrl } from "@/lib/totp";

/**
 * Starts (or restarts) 2FA setup: generates a fresh secret and saves it
 * un-enabled. totp_enabled only flips to 1 once /confirm verifies the user
 * actually scanned it and can produce a valid code — otherwise a user could
 * get locked out by a secret they never actually saved to their app.
 */
export async function POST() {
  const gate = await requireRole(ROLE_GROUPS.OPERATIONAL);
  if (!gate.ok) return gate.response;

  const secret = generateSecret();
  await pool.query("UPDATE users SET totp_secret = :secret, totp_enabled = 0 WHERE id = :id", {
    secret,
    id: Number(gate.session.user.id),
  });

  const qrCodeDataUrl = await generateQrCodeDataUrl(gate.session.user.email ?? "", secret);

  return NextResponse.json({ success: true, data: { secret, qrCodeDataUrl } });
}
