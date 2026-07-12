import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

const PORTAL_BY_ROLE: Record<string, string> = {
  owner: "/admin",
  staff: "/staff",
  agent: "/portal",
};

/**
 * Storefront-wide header so login state is actually visible here — before
 * this, logging in as any role landed back on this same page with no visual
 * difference, which made it look like login silently failed.
 */
export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const portalHref = session?.user ? PORTAL_BY_ROLE[session.user.role] : null;

  return (
    <div>
      <header className="flex items-center justify-between border-b border-slate-200 px-8 py-4 dark:border-slate-800">
        <Link href="/" className="font-semibold">AzureMed Hub</Link>
        {session?.user ? (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-500">
              Signed in as {session.user.name} ({session.user.role})
            </span>
            {portalHref && (
              <Link href={portalHref} className="rounded border px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">
                Go to {session.user.role === "owner" ? "Admin" : session.user.role === "staff" ? "Staff" : "Portal"}
              </Link>
            )}
            <LogoutButton />
          </div>
        ) : (
          <Link href="/login" className="rounded border px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
            Sign in
          </Link>
        )}
      </header>
      {children}
    </div>
  );
}
