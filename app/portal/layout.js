import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export const metadata = {
  title: "Agent Portal | AzureMed Hub",
  robots: { index: false, follow: false },
};

export default async function PortalLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["owner", "staff", "agent"].includes(session.user.role)) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 border-r border-slate-200 p-4 dark:border-slate-800">
        <p className="mb-4 text-sm font-medium text-slate-500">
          Agent Portal &middot; {session.user.name}
        </p>
        <nav className="flex flex-col gap-1 text-sm">
          <a href="/portal" className="rounded px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            Stock &amp; Checkout
          </a>
          <a href="/" className="rounded px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            Public Site
          </a>
          <a href="/account/security" className="rounded px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            Security
          </a>
        </nav>
        <div className="mt-4">
          <LogoutButton className="w-full" />
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
