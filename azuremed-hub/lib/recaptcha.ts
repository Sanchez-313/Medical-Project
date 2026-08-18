/**
 * Google reCAPTCHA v3 server-side verification. Gated by
 * RECAPTCHA_SECRET_KEY — until that's set in the environment, this no-ops
 * (returns ok: true) so local dev and any deployment that hasn't set up a
 * reCAPTCHA site yet keep working unblocked. Get real keys from
 * https://www.google.com/recaptcha/admin (register a v3 site) before relying
 * on this in production.
 */
const VERIFY_ENDPOINT = "https://www.google.com/recaptcha/api/siteverify";
const MIN_SCORE = 0.5; // v3 returns 0.0 (bot) - 1.0 (human); 0.5 is Google's own suggested default cutoff.

interface RecaptchaVerifyResult {
  ok: boolean;
  reason?: string;
}

export async function verifyRecaptcha(token: string | null | undefined): Promise<RecaptchaVerifyResult> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    return { ok: true };
  }

  if (!token) {
    return { ok: false, reason: "missing reCAPTCHA token" };
  }

  const response = await fetch(VERIFY_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret: secretKey, response: token }),
  });

  if (!response.ok) {
    return { ok: false, reason: "reCAPTCHA verification request failed" };
  }

  const result = (await response.json()) as {
    success: boolean;
    score?: number;
    action?: string;
    "error-codes"?: string[];
  };
  console.error("[recaptcha] siteverify result:", result);

  if (!result.success) {
    return { ok: false, reason: `reCAPTCHA rejected the token: ${(result["error-codes"] ?? []).join(", ")}` };
  }
  if (typeof result.score === "number" && result.score < MIN_SCORE) {
    return { ok: false, reason: `reCAPTCHA score too low (${result.score})` };
  }

  return { ok: true };
}
