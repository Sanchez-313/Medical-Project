import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import TwoFactorSettings from "@/components/TwoFactorSettings";

/** 2FA setup lives outside /admin, /staff, /portal so owner/staff/agent share one page regardless of dashboard. Customers ('user' role) don't get 2FA — see lib/rbac.ts ROLE_GROUPS.OPERATIONAL. */
export default async function AccountSecurityPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role === "user") redirect("/");

  const backHref =
    session.user.role === "owner" ? "/admin" : session.user.role === "staff" ? "/staff" : "/portal";

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">Account Security</h1>
      <p className="mt-2 text-slate-500">
        Two-factor authentication adds a second step to sign-in using an authenticator app
        (Google Authenticator, Authy, etc).
      </p>

      <div className="mt-8">
        <TwoFactorSettings backHref={backHref} />
      </div>
    </div>
  );
}
