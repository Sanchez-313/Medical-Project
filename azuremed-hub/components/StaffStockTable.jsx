"use client";

import { useState } from "react";
import Pagination from "@/components/Pagination";

const ITEMS_PER_PAGE = 10;

/**
 * Client island for the read-only stock table on the Staff dashboard —
 * pulled out of app/staff/page.js (a server component, for the DB query)
 * so pagination can have its own local state without converting the whole
 * page to a client fetch.
 */
export default function StaffStockTable({ stockRows }) {
  const [currentPage, setCurrentPage] = useState(1);

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const currentItems = stockRows.slice(indexOfLastItem - ITEMS_PER_PAGE, indexOfLastItem);

  return (
    <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-50 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
            <th className="px-8 py-5">Medicine</th>
            <th className="px-6 py-5">SKU</th>
            <th className="px-6 py-5">Category</th>
            <th className="px-6 py-5">Price (MMK)</th>
            <th className="px-6 py-5">Stock</th>
            <th className="px-6 py-5">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {currentItems.length === 0 && (
            <tr>
              <td colSpan={6} className="px-8 py-16 text-center font-bold text-slate-400">
                No products found.
              </td>
            </tr>
          )}
          {currentItems.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50/50">
              <td className="px-8 py-5 text-sm font-black text-slate-800">{item.name}</td>
              <td className="px-6 py-5 text-xs font-bold text-slate-500">{item.sku}</td>
              <td className="px-6 py-5 text-xs font-bold text-slate-500">{item.category}</td>
              <td className="px-6 py-5 text-sm font-black text-slate-900">
                {Number(item.selling_price_ks).toLocaleString()}
              </td>
              <td className="px-6 py-5 text-sm font-bold text-slate-700">{item.stock_qty}</td>
              <td className="px-6 py-5">
                <span
                  className={`rounded-lg px-3 py-1 text-[10px] font-black uppercase ${
                    item.status === "low" ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination
        currentPage={currentPage}
        totalItems={stockRows.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
