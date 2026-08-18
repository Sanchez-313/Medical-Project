"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

const STATUS_BADGE = {
  open: "bg-amber-100 text-amber-700",
  answered: "bg-emerald-100 text-emerald-700",
  closed: "bg-slate-100 text-slate-600",
};

/** "Handle Customer Queries" — Staff respond to customer questions submitted from the storefront Support page. */
export default function StaffQueriesPage() {
  const [queries, setQueries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function loadQueries() {
    setIsLoading(true);
    fetch("/api/staff/queries")
      .then((r) => r.json())
      .then((result) => setQueries(result.success ? result.data : []))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadQueries();
  }, []);

  function openReply(query) {
    setReplyTarget(query);
    setReplyText(query.staff_response ?? "");
    setError("");
  }

  async function submitReply(e) {
    e.preventDefault();
    if (!replyText.trim()) {
      setError("Enter a response before sending.");
      return;
    }
    setSaving(true);
    const result = await fetch("/api/staff/queries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: replyTarget.id, staff_response: replyText }),
    }).then((r) => r.json());
    setSaving(false);

    if (!result.success) {
      setError(result.message ?? "Could not send response");
      return;
    }
    setReplyTarget(null);
    loadQueries();
  }

  async function closeQuery(query) {
    await fetch("/api/staff/queries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: query.id, status: "closed" }),
    });
    loadQueries();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Customer Queries</h1>
        <p className="pt-3 text-slate-500">Questions submitted by customers through the storefront Support page.</p>
      </div>

      <div className="space-y-4">
        {isLoading && <p className="text-sm text-slate-400">Loading...</p>}
        {!isLoading && queries.length === 0 && (
          <p className="rounded-[2rem] border border-slate-100 bg-white p-10 text-center text-sm text-slate-400">
            No customer queries yet.
          </p>
        )}
        {!isLoading &&
          queries.map((query) => (
            <div key={query.id} className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                      <MessageCircle size={16} />
                    </div>
                    <p className="font-black text-slate-800">{query.subject}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{query.message}</p>
                  <p className="mt-2 text-xs font-semibold text-slate-400">
                    {query.customer_name} &middot; {query.customer_email} &middot; {new Date(query.created_at).toLocaleString()}
                  </p>
                </div>
                <span className={`shrink-0 rounded-lg px-3 py-1 text-[10px] font-black uppercase ${STATUS_BADGE[query.status] ?? STATUS_BADGE.open}`}>
                  {query.status}
                </span>
              </div>

              {query.staff_response && (
                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-blue-500">Your Response</p>
                  <p className="mt-1 text-sm text-blue-900">{query.staff_response}</p>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => openReply(query)}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700"
                >
                  {query.staff_response ? "Edit Response" : "Reply"}
                </button>
                {query.status !== "closed" && (
                  <button
                    type="button"
                    onClick={() => closeQuery(query)}
                    className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-200"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>

      {replyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-8 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900">Respond to &quot;{replyTarget.subject}&quot;</h3>
            <p className="mt-2 text-sm text-slate-500">{replyTarget.message}</p>

            <form onSubmit={submitReply} className="mt-5 space-y-4">
              <textarea
                rows={4}
                autoFocus
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your response..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReplyTarget(null)}
                  disabled={saving}
                  className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Sending..." : "Send Response"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
