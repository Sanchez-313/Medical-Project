import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data: blob:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'"
  );
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export default withAuth(
  function middleware(req: NextRequest & { nextauth?: { token?: { role?: string } } }) {
    const { pathname } = req.nextUrl;
    const role = (req as NextRequest & { nextauth: { token?: { role?: string } } }).nextauth
      ?.token?.role;

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
  ],
};
