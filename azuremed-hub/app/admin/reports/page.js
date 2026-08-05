"use client";

import { useEffect, useState } from "react";
import { BarChart3, Download } from "lucide-react";
import DateRangeCalendar from "@/components/DateRangeCalendar";

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

const DEFAULT_TO = isoDate(new Date());
const DEFAULT_FROM = isoDate(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000));

/**
 * The original ReportsDashboard.jsx also covered customer reviews/ratings,
 * which have no table in this schema yet — this page shows what IS real
 * (sales-based reporting), now with a date-range calendar to review any
 * period day by day, plus a CSV export of that period.
 */
export default function ReportsPage() {
  const [from, setFrom] = useState(DEFAULT_FROM);
  const [to, setTo] = useState(DEFAULT_TO);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError("");

    const params = new URLSearchParams({ from, to });
    fetch(`/api/admin/reports?${params}`)
      .then((r) => r.json())
      .then((result) => {
        if (!mounted) return;
        if (!result.success) {
          setError(result.message || "Could not load report.");
          return;
        }
        setData(result.data);
      })
      .catch(() => mounted && setError("Could not load report."))
      .finally(() => mounted && setIsLoading(false));

    return () => {
      mounted = false;
    };
  }, [from, to]);

  const exportUrl = `/api/admin/reports?${new URLSearchParams({ from, to, format: "csv" })}`;
  const totals = data?.totals;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">အစီရင်ခံစာများ</h1>
          <p className="pt-3 text-slate-500">Sales reporting from real checkout data — review any period day by day.</p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <DateRangeCalendar
            from={from}
            to={to}
            maxDate={DEFAULT_TO}
            onChange={(nextFrom, nextTo) => {
              setFrom(nextFrom);
              setTo(nextTo);
            }}
          />
          <a
            href={exportUrl}
            download
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black uppercase text-white shadow-md shadow-blue-100 hover:bg-blue-700"
          >
            <Download size={16} /> Export CSV
          </a>
        </div>
      </div>

      {error && <p className="mb-6 text-sm font-semibold text-red-600">{error}</p>}

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Sales</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{isLoading ? "…" : totals?.saleCount ?? 0}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Revenue</p>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {isLoading ? "…" : `${Number(totals?.totalRevenueKs ?? 0).toLocaleString()} Ks`}
          </p>
        </div>
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Average Sale</p>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {isLoading ? "…" : `${Math.round(Number(totals?.avgSaleKs ?? 0)).toLocaleString()} Ks`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-8 py-5">
            <h3 className="font-black text-lg">Day by Day</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-slate-50 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                  <th className="px-8 py-4">Date</th>
                  <th className="px-6 py-4">Sales</th>
                  <th className="px-6 py-4">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading && (
                  <tr><td colSpan={3} className="px-8 py-10 text-center text-slate-400">Loading...</td></tr>
                )}
                {!isLoading && (data?.daily?.length ?? 0) === 0 && (
                  <tr><td colSpan={3} className="px-8 py-10 text-center text-slate-400">No sales in this period.</td></tr>
                )}
                {!isLoading &&
                  data?.daily
                    ?.slice()
                    .reverse()
                    .map((row) => (
                      <tr key={row.date}>
                        <td className="px-8 py-3 text-sm font-bold text-slate-700">
                          {new Date(row.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-600">{row.saleCount}</td>
                        <td className="px-6 py-3 text-sm font-black text-slate-900">{Number(row.revenueKs).toLocaleString()} Ks</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-8 py-5">
            <h3 className="font-black text-lg">Revenue by Payment Method</h3>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                <th className="px-8 py-4">Method</th>
                <th className="px-6 py-4">Sales</th>
                <th className="px-6 py-4">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading && (
                <tr><td colSpan={3} className="px-8 py-10 text-center text-slate-400">Loading...</td></tr>
              )}
              {!isLoading && (data?.byPaymentMethod?.length ?? 0) === 0 && (
                <tr><td colSpan={3} className="px-8 py-10 text-center text-slate-400">No sales in this period.</td></tr>
              )}
              {!isLoading &&
                data?.byPaymentMethod?.map((row) => (
                  <tr key={row.payment_method}>
                    <td className="px-8 py-4 text-sm font-black text-slate-800 uppercase">{row.payment_method}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{row.count}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{Number(row.totalKs).toLocaleString()} Ks</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm text-slate-500 text-sm">
        <BarChart3 size={20} className="text-blue-500 shrink-0" />
        Customer review/rating reporting from the original ReportsDashboard isn&apos;t migrated yet — the reviews table exists and backs the storefront testimonials, it just isn&apos;t surfaced in this dashboard yet.
      </div>
    </div>
  );
}
