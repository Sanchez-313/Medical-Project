import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequestWithAuth } from "next-auth/middleware";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

// Brute-force / mass-registration protection on the two public auth
// endpoints. 8 attempts per minute per IP is generous for a real user
// (typos, forgotten passwords) but throttles a credential-stuffing script.
const AUTH_RATE_LIMIT = 8;
const AUTH_RATE_WINDOW_MS = 60_000;
const RATE_LIMITED_PATHS = ["/api/auth/callback/credentials", "/api/auth/register"];

// Path-prefix -> allowed roles.
//   /admin -> owner only (revenue, logs, system config)
//   /staff -> owner + staff (POS billing, stock views, no financials)
//   /portal -> owner + staff + agent (front-line agent portal: browse stock, light POS)
//   /api/admin, /api/staff, /api/portal -> mirror their page counterparts
const ROUTE_RULES: Array<{ prefix: string; roles: string[] }> = [
  { prefix: "/admin", roles: ["owner"] },
  { prefix: "/api/admin", roles: ["owner"] },
  { prefix: "/staff", roles: ["owner", "staff"] },
  { prefix: "/api/staff", roles: ["owner", "staff"] },
  { prefix: "/portal", roles: ["owner", "staff", "agent"] },
  { prefix: "/api/portal", roles: ["owner", "staff", "agent"] },
];

function applySecurityHeaders(response: NextResponse): NextResponse {
  // Next.js dev mode needs eval() for Fast Refresh/source maps and injects
  // an inline bootstrap <script> for RSC hydration — a strict 'self'-only
  // script-src blocks both, breaking every protected page on a fresh
  // (non-HMR) load: no hydration means no useEffect, no onClick, pages get
  // stuck showing their initial loading state. Production has no such
  // requirement, so only development gets the relaxed policy.
  const scriptSrc =
    process.env.NODE_ENV === "production" ? "script-src 'self'" : "script-src 'self' 'unsafe-eval' 'unsafe-inline'";
  response.headers.set(
    "Content-Security-Policy",
    `default-src 'self'; img-src 'self' data: blob:; ${scriptSrc}; style-src 'self' 'unsafe-inline'; connect-src 'self'`
  );
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Protected dashboard pages must never be servable from the browser's
  // back/forward cache (bfcache) — without this, clicking Back after logout
  // can show a stale authenticated page straight from cache, with no request
  // ever reaching the server (and thus never hitting this middleware).
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl;

    if (req.method === "POST" && RATE_LIMITED_PATHS.some((path) => pathname.startsWith(path))) {
      const key = `${clientIp(req)}:${pathname}`;
      const result = checkRateLimit(key, AUTH_RATE_LIMIT, AUTH_RATE_WINDOW_MS);
      if (!result.allowed) {
        return applySecurityHeaders(
          NextResponse.json(
            { success: false, message: "Too many attempts. Please try again shortly." },
            { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } }
          )
        );
      }
    }

    const role = req.nextauth.token?.role;

    const rule = ROUTE_RULES.find((r) => pathname.startsWith(r.prefix));
    if (rule && (!role || !rule.roles.includes(role))) {
      if (pathname.startsWith("/api/")) {
        return applySecurityHeaders(
          NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
        );
      }
      return applySecurityHeaders(NextResponse.redirect(new URL("/login", req.url)));
    }

    return applySecurityHeaders(NextResponse.next());
  },
  {
    callbacks: {
      authorized: () => true,
    },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/staff/:path*",
    "/portal/:path*",
    "/api/admin/:path*",
    "/api/staff/:path*",
    "/api/portal/:path*",
    "/api/auth/callback/credentials",
    "/api/auth/register",
  ],
};
