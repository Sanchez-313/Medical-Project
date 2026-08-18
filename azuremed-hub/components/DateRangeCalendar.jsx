"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

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
 * Plain, modern layout — matches DatePicker.jsx's styling; two clicks pick
 * a range (start, then end), no extra chrome beyond that.
 */
export default function DateRangeCalendar({ from, to, onChange, maxDate }) {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = fromIso(to || from);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const panelRef = useRef(null);

  // Anchoring to the trigger's left edge overflows off-screen for a field
  // positioned further right on the page — measure after the panel renders
  // and flip to right-aligned if it would extend past the viewport edge.
  useLayoutEffect(() => {
    if (!open || !panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    setAlignRight(rect.right > window.innerWidth);
  }, [open, viewMonth]);

  useEffect(() => {
    if (!open) setAlignRight(false);
  }, [open]);

  const today = new Date();
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
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:border-blue-300"
      >
        <CalendarDays size={16} className="text-slate-400" />
        {formatDisplay(from)} <span className="text-slate-300">&rarr;</span> {formatDisplay(to)}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-50 mt-2 w-[320px] rounded-2xl border border-slate-100 bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewMonth(new Date(year, month - 1, 1))}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Previous month"
              >
                <ChevronLeft size={18} />
              </button>
              <p className="text-base font-semibold text-slate-900">
                {MONTH_NAMES[month]} {year}
              </p>
              <button
                type="button"
                onClick={() => setViewMonth(new Date(year, month + 1, 1))}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Next month"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="grid grid-cols-7">
              {WEEKDAY_LABELS.map((label, i) => (
                <span key={i} className="pb-2 text-center text-xs font-medium text-slate-400">
                  {label}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1">
              {cells.map((date, i) => {
                if (!date) return <span key={i} />;
                const iso = toIso(date);
                const isSelected = iso === from || iso === to;
                const isInRange = from && to && date > fromDate && date < toDate;
                const isToday = iso === toIso(today);
                const isDisabled = maxDateObj && date > maxDateObj;
                return (
                  <div key={i} className="flex items-center justify-center">
                    <button
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleDayClick(date)}
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm transition-all ${
                        isDisabled
                          ? "cursor-not-allowed text-slate-200"
                          : isSelected
                          ? "bg-blue-600 font-semibold text-white"
                          : isInRange
                          ? "bg-blue-50 font-medium text-blue-700"
                          : isToday
                          ? "font-semibold text-blue-600 ring-1 ring-inset ring-blue-200 hover:bg-blue-50"
                          : "font-medium text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {date.getDate()}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
