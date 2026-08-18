"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Shared pagination control — numbered pills with ellipsis truncation for
 * many pages (e.g. 1,2,3…,26,27,28), prev/next chevrons, and a "Showing X to
 * Y of Z" label. Same visual/behavior as the one already in
 * app/admin/inventory/page.js, pulled out so app/staff/page.js,
 * app/staff/orders/page.js, and app/staff/products/page.js don't each
 * reimplement it.
 */
export default function Pagination({ currentPage, totalItems, itemsPerPage, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const siblingCount = 1;
  const totalVisible = siblingCount * 2 + 5;
  let pageNumbers;
  if (totalVisible >= totalPages) {
    pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  } else {
    const leftSibling = Math.max(currentPage - siblingCount, 1);
    const rightSibling = Math.min(currentPage + siblingCount, totalPages);
    const showLeftEllipsis = leftSibling > 2;
    const showRightEllipsis = rightSibling < totalPages - 1;

    if (!showLeftEllipsis && showRightEllipsis) {
      const leftRange = Array.from({ length: 3 + 2 * siblingCount }, (_, i) => i + 1);
      pageNumbers = [...leftRange, "…", totalPages];
    } else if (showLeftEllipsis && !showRightEllipsis) {
      const count = 3 + 2 * siblingCount;
      const rightRange = Array.from({ length: count }, (_, i) => totalPages - count + i + 1);
      pageNumbers = [1, "…", ...rightRange];
    } else {
      const middleRange = Array.from({ length: rightSibling - leftSibling + 1 }, (_, i) => leftSibling + i);
      pageNumbers = [1, "…", ...middleRange, "…", totalPages];
    }
  }

  if (totalItems === 0) return null;

  return (
    <div className="flex items-center justify-between border-t border-slate-50 bg-slate-50/20 px-8 py-5">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalItems)} of {totalItems}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`rounded-lg border border-slate-200 p-2 transition-all ${
            currentPage === 1 ? "cursor-not-allowed opacity-20" : "shadow-sm hover:bg-white hover:text-blue-600"
          }`}
        >
          <ChevronLeft size={16} />
        </button>
        {pageNumbers.map((pageNum, i) =>
          pageNum === "…" ? (
            <span
              key={`ellipsis-${i}`}
              className="flex h-9 min-w-[36px] items-center justify-center text-xs font-black text-slate-400"
            >
              …
            </span>
          ) : (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={`h-9 min-w-[36px] rounded-lg border text-xs font-black transition-all ${
                currentPage === pageNum
                  ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-100"
                  : "border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:text-blue-600"
              }`}
            >
              {pageNum}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`rounded-lg border border-slate-200 p-2 transition-all ${
            currentPage === totalPages ? "cursor-not-allowed opacity-20" : "shadow-sm hover:bg-white hover:text-blue-600"
          }`}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
