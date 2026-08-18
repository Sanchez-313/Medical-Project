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
//   /admin -> admin only (revenue, logs, system config)
//   /staff -> admin + staff (POS billing, stock views, no financials)
//   /portal -> admin + staff + agent (front-line agent portal: browse stock, light POS)
//   /api/admin, /api/staff, /api/portal -> mirror their page counterparts
const ROUTE_RULES: Array<{ prefix: string; roles: string[] }> = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/api/admin", roles: ["admin"] },
  { prefix: "/staff", roles: ["admin", "staff"] },
  { prefix: "/api/staff", roles: ["admin", "staff"] },
  { prefix: "/portal", roles: ["admin", "staff", "agent"] },
  { prefix: "/api/portal", roles: ["admin", "staff", "agent"] },
];

function applySecurityHeaders(response: NextResponse, nonce: string): NextResponse {
  // Next.js injects inline <script> tags itself in BOTH dev and production
  // — Fast Refresh/eval in dev, but also the RSC-payload/hydration bootstrap
  // scripts in production builds. A bare 'self' script-src blocks those
  // too, breaking every protected page after hydration (no useEffect, no
  // onClick, stuck on the initial loading state). Instead of relaxing to
  // 'unsafe-inline' in production, we use a per-request nonce: Next.js
  // automatically stamps this nonce onto the inline scripts it generates
  // once it sees one in the CSP header, so only Next's own scripts (and
  // anything we explicitly tag) run — no unsafe-inline needed.
  // 'strict-dynamic' lets those nonce-trusted scripts load Next's chunk
  // scripts in turn; 'self' stays listed for older browsers that ignore
  // strict-dynamic.
  const scriptSrc =
    process.env.NODE_ENV === "production"
      ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`
      : "script-src 'self' 'unsafe-eval' 'unsafe-inline'";
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
    // Web Crypto is available globally in the Edge middleware runtime.
    const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

    if (req.method === "POST" && RATE_LIMITED_PATHS.some((path) => pathname.startsWith(path))) {
      const key = `${clientIp(req)}:${pathname}`;
      const result = checkRateLimit(key, AUTH_RATE_LIMIT, AUTH_RATE_WINDOW_MS);
      if (!result.allowed) {
        return applySecurityHeaders(
          NextResponse.json(
            { success: false, message: "Too many attempts. Please try again shortly." },
            { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } }
          ),
          nonce
        );
      }
    }

    const role = req.nextauth.token?.role;

    const rule = ROUTE_RULES.find((r) => pathname.startsWith(r.prefix));
    if (rule && (!role || !rule.roles.includes(role))) {
      if (pathname.startsWith("/api/")) {
        return applySecurityHeaders(
          NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 }),
          nonce
        );
      }
      return applySecurityHeaders(NextResponse.redirect(new URL("/login", req.url)), nonce);
    }

    // Forward the nonce on the request so Server Components can read it
    // via headers().get("x-nonce") if they ever need to tag a custom
    // inline/external <script> themselves.
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-nonce", nonce);

    return applySecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }), nonce);
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
