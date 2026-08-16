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
  if (!iso) return null;
  return fromIso(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Single-date sibling of DateRangeCalendar.jsx — same hand-built calendar
 * (not a native <input type="date">, which renders its icon/format using
 * the browser's OS locale and looks inconsistent/broken across browsers)
 * for one-value fields like a product's expiry date instead of a from/to
 * range. Plain, modern layout — no reference library's theme to match,
 * just comfortable spacing/touch targets and one click to pick a date.
 */
export default function DatePicker({ value, onChange, placeholder = "Select date", allowClear = true }) {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = value ? fromIso(value) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const panelRef = useRef(null);

  // Anchoring to the trigger's left edge overflows off-screen for a field
  // positioned further right on the page (e.g. the "To" date on Reports) —
  // measure after the panel renders and flip to right-aligned if it would
  // extend past the viewport edge.
  useLayoutEffect(() => {
    if (!open || !panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    setAlignRight(rect.right > window.innerWidth);
  }, [open, viewMonth]);

  useEffect(() => {
    if (!open) setAlignRight(false);
  }, [open]);

  const today = new Date();
  const selectedDate = value ? fromIso(value) : null;
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const startWeekday = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));

  function handleDayClick(date) {
    onChange(toIso(date));
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setViewMonth(() => {
            const d = value ? fromIso(value) : new Date();
            return new Date(d.getFullYear(), d.getMonth(), 1);
          });
          setOpen((v) => !v);
        }}
        className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition-all hover:border-blue-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50"
      >
        <CalendarDays size={16} className="shrink-0 text-slate-400" />
        <span className={value ? "font-bold text-slate-700" : "text-slate-400"}>
          {formatDisplay(value) ?? placeholder}
        </span>
        {allowClear && value && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                onChange("");
              }
            }}
            className="ml-auto text-xs font-bold text-slate-300 hover:text-slate-500"
          >
            Clear
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            ref={panelRef}
            className={`absolute z-50 mt-2 w-[320px] rounded-2xl border border-slate-100 bg-white p-4 shadow-xl ${
              alignRight ? "right-0" : "left-0"
            }`}
          >
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
                const isSelected = selectedDate && toIso(date) === toIso(selectedDate);
                const isToday = toIso(date) === toIso(today);
                return (
                  <div key={i} className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleDayClick(date)}
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm transition-all ${
                        isSelected
                          ? "bg-blue-600 font-semibold text-white"
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
