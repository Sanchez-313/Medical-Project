"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function toIso(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fromIso(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDisplay(iso) {
  const date = fromIso(iso);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Hand-built calendar (not a native <input type="date">) — native date
 * inputs render their placeholder/picker using the browser's OS locale,
 * which on non-English systems shows unfamiliar tokens instead of
 * "dd/mm/yyyy" and looks broken. This renders identically everywhere.
 */
export default function DateRangeCalendar({ from, to, onChange, maxDate }) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = fromIso(to || from);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const fromDate = fromIso(from);
  const toDate = fromIso(to);
  const maxDateObj = maxDate ? fromIso(maxDate) : null;

  function handleDayClick(date) {
    const iso = toIso(date);
    if (!from || (from && to && from !== to) || date < fromDate) {
      onChange(iso, iso);
    } else {
      if (date < fromDate) {
        onChange(iso, from);
      } else {
        onChange(from, iso);
      }
    }
  }

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const startWeekday = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:border-blue-300"
      >
        <CalendarDays size={16} className="text-slate-400" />
        {formatDisplay(from)} <span className="text-slate-300">&rarr;</span> {formatDisplay(to)}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-72 rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewMonth(new Date(year, month - 1, 1))}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
            >
              <ChevronLeft size={16} />
            </button>
            <p className="text-sm font-black text-slate-800">
              {MONTH_NAMES[month]} {year}
            </p>
            <button
              type="button"
              onClick={() => setViewMonth(new Date(year, month + 1, 1))}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAY_LABELS.map((label, i) => (
              <span key={i} className="text-[10px] font-black uppercase text-slate-300">
                {label}
              </span>
            ))}
            {cells.map((date, i) => {
              if (!date) return <span key={i} />;
              const iso = toIso(date);
              const isSelected = iso === from || iso === to;
              const isInRange = from && to && date > fromDate && date < toDate;
              const isDisabled = maxDateObj && date > maxDateObj;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleDayClick(date)}
                  className={`h-8 rounded-lg text-xs font-bold transition-all ${
                    isDisabled
                      ? "cursor-not-allowed text-slate-200"
                      : isSelected
                      ? "bg-blue-600 text-white"
                      : isInRange
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-3 w-full rounded-xl bg-slate-100 py-2 text-xs font-black uppercase text-slate-600 hover:bg-slate-200"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
