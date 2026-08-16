/**
 * Shared password-strength rule — imported by both the register page
 * (client-side, for instant feedback) and app/api/auth/register/route.ts
 * (server-side, the actual enforcement — a client check alone can always be
 * bypassed by calling the API directly).
 */
export const PASSWORD_RULES_TEXT =
  "At least 8 characters, with an uppercase letter, a lowercase letter, a number, and a special character.";

const HAS_UPPER = /[A-Z]/;
const HAS_LOWER = /[a-z]/;
const HAS_NUMBER = /[0-9]/;
const HAS_SPECIAL = /[^A-Za-z0-9]/;

/** Returns an error message if the password is too weak, or null if it passes. */
export function validatePasswordStrength(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!HAS_UPPER.test(password)) return "Password must include an uppercase letter.";
  if (!HAS_LOWER.test(password)) return "Password must include a lowercase letter.";
  if (!HAS_NUMBER.test(password)) return "Password must include a number.";
  if (!HAS_SPECIAL.test(password)) return "Password must include a special character (e.g. !@#$%).";
  return null;
}
