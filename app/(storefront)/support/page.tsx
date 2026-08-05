import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/config/db";
import SupportQueryForm from "@/components/SupportQueryForm";
import type { RowDataPacket } from "mysql2";

// Explicit, not relying on getServerSession usage alone to signal dynamic
// rendering to Next — a build-time DB connection to a host unreachable from
// Vercel's build servers (like localhost) is fatal either way.
export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  open: "bg-amber-100 text-amber-700",
  answered: "bg-emerald-100 text-emerald-700",
  closed: "bg-slate-100 text-slate-600",
};

/** "Handle Customer Queries" — customer side: submit a question, see Staff's response here. */
export default async function SupportPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const [queries] = await pool.query<RowDataPacket[]>(
    `SELECT id, subject, message, status, staff_response, responded_at, created_at
     FROM customer_queries WHERE user_id = :userId ORDER BY created_at DESC`,
    { userId: Number(session.user.id) }
  );

  return (
    <div className="mx-auto max-w-3xl px-6 pt-32 pb-16">
      <h1 className="text-3xl font-bold text-slate-800">Support</h1>
      <p className="mt-1 text-sm text-slate-500">Have a question? Send us a message and we&apos;ll get back to you.</p>

      <div className="mt-8">
        <SupportQueryForm />
      </div>

      <div className="mt-10 space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Your Messages</h2>
        {queries.length === 0 && (
          <p className="rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-500">
            You haven&apos;t sent any messages yet.
          </p>
        )}
        {queries.map((query) => (
          <div key={query.id} className="rounded-2xl border border-slate-100 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black text-slate-800">{query.subject}</p>
                <p className="mt-1 text-sm text-slate-600">{query.message}</p>
              </div>
              <span className={`shrink-0 rounded-lg px-3 py-1 text-[10px] font-black uppercase ${STATUS_BADGE[query.status] ?? STATUS_BADGE.open}`}>
                {query.status}
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-400">{new Date(query.created_at).toLocaleString()}</p>

            {query.staff_response && (
              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-blue-500">Response</p>
                <p className="mt-1 text-sm text-blue-900">{query.staff_response}</p>
                {query.responded_at && (
                  <p className="mt-2 text-xs text-blue-400">{new Date(query.responded_at).toLocaleString()}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
