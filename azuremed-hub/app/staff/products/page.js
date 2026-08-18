"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Search, Boxes, X as XIcon } from "lucide-react";
import Pagination from "@/components/Pagination";

const ITEMS_PER_PAGE = 10;

const STATUS_BADGE = {
  normal: "bg-emerald-100 text-emerald-700",
  low: "bg-amber-100 text-amber-700",
  expired: "bg-red-100 text-red-700",
};

/**
 * "View Product List" + "Manage Inventory" — read-only catalog browsing plus
 * stock-quantity adjustments. Full product editing (name/category/price/
 * description/image/expiry, creating new products) is Owner-only, done from
 * /admin/inventory — see app/api/staff/medicines/route.ts for why.
 */
export default function StaffProductsPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(searchParams.get("filter") === "low" ? "low" : "all");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [stockTarget, setStockTarget] = useState(null);
  const [stockValue, setStockValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function loadProducts() {
    setIsLoading(true);
    fetch("/api/staff/medicines")
      .then((r) => r.json())
      .then((result) => setProducts(result.success ? result.data : []))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    setFilter(searchParams.get("filter") === "low" ? "low" : "all");
  }, [searchParams]);

  const filtered = products.filter(
    (p) =>
      (filter === "all" || p.status === filter) &&
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const currentItems = filtered.slice(indexOfLastItem - ITEMS_PER_PAGE, indexOfLastItem);

  function openStockUpdate(product) {
    setStockTarget(product);
    setStockValue(String(product.stock_qty));
    setError("");
  }

  async function handleStockSubmit(e) {
    e.preventDefault();
    const parsed = Number(stockValue);
    if (!Number.isInteger(parsed) || parsed < 0) {
      setError("Enter a non-negative whole number.");
      return;
    }

    setSaving(true);
    const result = await fetch("/api/staff/medicines", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: stockTarget.id, stock_qty: parsed }),
    }).then((r) => r.json());
    setSaving(false);

    if (!result.success) {
      setError(result.message ?? "Could not update stock");
      return;
    }
    setStockTarget(null);
    loadProducts();
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Products</h1>
          <p className="pt-3 text-slate-500">
            Browse the catalog and update stock quantities. Adding new products or editing details is done by the Admin.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex rounded-xl border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-lg px-4 py-2 text-xs font-black transition-colors ${
                filter === "all" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              All Products
            </button>
            <button
              type="button"
              onClick={() => setFilter("low")}
              className={`rounded-lg px-4 py-2 text-xs font-black transition-colors ${
                filter === "low" ? "bg-orange-500 text-white" : "text-slate-500 hover:bg-orange-50"
              }`}
            >
              Low Stock ({products.filter((product) => product.status === "low").length})
            </button>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/10"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-50 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
              <th className="px-8 py-5">Product</th>
              <th className="px-6 py-5">Category</th>
              <th className="px-6 py-5">Price (MMK)</th>
              <th className="px-6 py-5">Stock</th>
              <th className="px-6 py-5">Expiry</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5">Inventory</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading && (
              <tr><td colSpan={7} className="px-8 py-16 text-center font-bold text-slate-400">Loading...</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={7} className="px-8 py-16 text-center font-bold text-slate-400">No products found.</td></tr>
            )}
            {!isLoading &&
              currentItems.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/50">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                        {product.image_url && (
                          <Image src={product.image_url} alt={product.name} fill className="object-contain" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">{product.name}</p>
                        <p className="text-[10px] font-bold text-slate-400">{product.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-xs font-bold text-slate-500">{product.category}</td>
                  <td className="px-6 py-5 text-sm font-black text-slate-900">
                    {Number(product.selling_price_ks).toLocaleString()}
                  </td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-700">{product.stock_qty}</td>
                  <td className="px-6 py-5 text-xs font-semibold text-slate-400">
                    {product.expiry_date ? new Date(product.expiry_date).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-5">
                    <span className={`rounded-lg px-3 py-1 text-[10px] font-black uppercase ${STATUS_BADGE[product.status] ?? STATUS_BADGE.normal}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <button
                      type="button"
                      onClick={() => openStockUpdate(product)}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 hover:bg-blue-100"
                    >
                      <Boxes size={14} /> Update Stock
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        <Pagination
          currentPage={currentPage}
          totalItems={filtered.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </div>

      {stockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-sm rounded-[2rem] bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Update Stock</h3>
              <button type="button" onClick={() => setStockTarget(null)} className="text-slate-400 hover:text-slate-700">
                <XIcon size={20} />
              </button>
            </div>
            <p className="mb-4 text-sm font-semibold text-slate-500">{stockTarget.name}</p>

            <form onSubmit={handleStockSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  autoFocus
                  value={stockValue}
                  onChange={(e) => setStockValue(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-lg font-black outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStockTarget(null)}
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
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
