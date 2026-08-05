import { getServerSession, type Session } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import type { Role } from "@/types/next-auth";

/**
 * Server-side role gate for API routes and Server Components. Every route
 * that returns operational or financial data MUST call this before querying
 * the database — never rely on a hidden UI element to keep data private.
 */
export async function requireRole(allowed: Role[]): Promise<
  | { ok: true; session: Session }
  | { ok: false; response: NextResponse }
> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!allowed.includes(session.user.role)) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, session };
}

export const ROLE_GROUPS = {
  OWNER_ONLY: ["owner"] as Role[],
  MANAGERIAL: ["owner", "staff"] as Role[],
  OPERATIONAL: ["owner", "staff", "agent"] as Role[],
  // Any signed-in account, including customers — used for features like AI
  // detection that the report scopes to "registered users", not just staff.
  ANY_AUTHENTICATED: ["owner", "staff", "agent", "user"] as Role[],
};
