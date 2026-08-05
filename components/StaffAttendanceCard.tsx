"use client";

import { useEffect, useState } from "react";
import { Clock, LogIn, LogOut } from "lucide-react";

interface AttendanceDay {
  work_date: string;
  check_in_at: string | null;
  check_out_at: string | null;
}

function formatTime(value: string | null) {
  if (!value) return "--:--";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function StaffAttendanceCard() {
  const [today, setToday] = useState<AttendanceDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    return fetch("/api/staff/attendance")
      .then((r) => r.json())
      .then((result) => setToday(result.success ? result.data.today : null))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function checkIn() {
    setBusy(true);
    setError(null);
    const result = await fetch("/api/staff/attendance", { method: "POST" }).then((r) => r.json());
    setBusy(false);
    if (!result.success) {
      setError(result.message);
      return;
    }
    load();
  }

  async function checkOut() {
    setBusy(true);
    setError(null);
    const result = await fetch("/api/staff/attendance", { method: "PATCH" }).then((r) => r.json());
    setBusy(false);
    if (!result.success) {
      setError(result.message);
      return;
    }
    load();
  }

  const hasCheckedIn = Boolean(today?.check_in_at);
  const hasCheckedOut = Boolean(today?.check_out_at);

  return (
    <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
          <Clock size={18} />
        </div>
        <div>
          <h3 className="font-black text-slate-900">Attendance</h3>
          <p className="text-xs font-semibold text-slate-400">Today</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Check In</p>
              <p className="mt-1 text-lg font-black text-slate-900">{formatTime(today?.check_in_at ?? null)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Check Out</p>
              <p className="mt-1 text-lg font-black text-slate-900">{formatTime(today?.check_out_at ?? null)}</p>
            </div>
          </div>

          {error && <p className="mb-3 text-xs font-semibold text-red-600">{error}</p>}

          {!hasCheckedIn && (
            <button
              type="button"
              onClick={checkIn}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md shadow-emerald-100 transition-all hover:bg-emerald-700 disabled:opacity-50"
            >
              <LogIn size={16} /> Check In
            </button>
          )}
          {hasCheckedIn && !hasCheckedOut && (
            <button
              type="button"
              onClick={checkOut}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-slate-900 disabled:opacity-50"
            >
              <LogOut size={16} /> Check Out
            </button>
          )}
          {hasCheckedIn && hasCheckedOut && (
            <p className="rounded-xl bg-emerald-50 py-3 text-center text-sm font-bold text-emerald-700">
              Shift complete for today
            </p>
          )}
        </>
      )}
    </div>
  );
}
