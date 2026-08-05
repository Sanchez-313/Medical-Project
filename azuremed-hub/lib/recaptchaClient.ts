"use client";

// Mirrors lib/recaptcha.ts's server-side gating: if no site key is
// configured, this resolves to undefined and the server-side verify()
// no-ops too (since it checks for RECAPTCHA_SECRET_KEY), so the whole
// feature is inert until both env vars are set — no broken login/signup in
// the meantime.
const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

let scriptLoadPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (!SITE_KEY) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    if (window.grecaptcha) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load reCAPTCHA"));
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
}

export async function getRecaptchaToken(action: string): Promise<string | undefined> {
  if (!SITE_KEY) return undefined;

  try {
    await loadScript();
    return await new Promise<string>((resolve, reject) => {
      window.grecaptcha!.ready(() => {
        window
          .grecaptcha!.execute(SITE_KEY, { action })
          .then(resolve)
          .catch(reject);
      });
    });
  } catch (error) {
    // Don't block login/signup if reCAPTCHA itself fails to load (network
    // blip, ad-blocker) — the server just treats a missing token the same
    // as reCAPTCHA being unconfigured when RECAPTCHA_SECRET_KEY is unset,
    // and rejects it when the secret IS set, which is the safe direction.
    // Logged (not swallowed silently) since a domain-lock mismatch on the
    // reCAPTCHA site key looks identical to "network blip" otherwise.
    console.error("[recaptcha] token fetch failed:", error);
    return undefined;
  }
}
