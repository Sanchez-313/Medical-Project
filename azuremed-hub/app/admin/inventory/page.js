"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import {
  Search,
  Pill,
  Layers,
  PackagePlus,
  AlertCircle,
  AlertTriangle,
  Banknote,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  X as XIcon,
} from "lucide-react";
import DatePicker from "@/components/DatePicker";

const CATEGORIES = [
  "Fever, Cough & Cold",
  "Fitness & Supplement",
  "Sexual Wellness",
  "Mother & Child",
  "Traditional Medicine",
  "Personal Care & Equipment",
];

const EMPTY_FORM = {
  id: null,
  name: "",
  sku: "",
  category: CATEGORIES[0],
  description: "",
  selling_price_ks: "",
  cost_price_ks: "",
  stock_qty: "",
  reorder_level: "",
  expiry_date: "",
};

/**
 * Faithful port of Admin-Dashboard/src/components/InventoryDashboard/InventoryDashboard.jsx
 * (table, low-stock banner, pagination, stat cards). Field names adapted to
 * this project's real schema (stock_qty/selling_price_ks/reorder_level
 * instead of the old stock/price_ks/total_stock). Category tabs are the real
 * seeded taxonomy — see the comment above RAW_PRODUCTS in
 * scripts/fullCatalog.js for the 6 categories and how products map to them.
 */
export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState("All Items");
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deactivatingId, setDeactivatingId] = useState(null);

  const loadItems = useCallback(() => {
    setIsLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (activeTab !== "All Items") params.set("category", activeTab);

    return fetch(`/api/admin/medicines?${params}`)
      .then((r) => r.json())
      .then((result) => {
        if (!result.success) {
          setError(result.message || "ကုန်ပစ္စည်းစာရင်းကို မရယူနိုင်ပါ။");
          setItems([]);
          return;
        }
        setItems(result.data);
        setCurrentPage(1);
      })
      .catch(() => setError("ကုန်ပစ္စည်းစာရင်းကို မရယူနိုင်ပါ။"))
      .finally(() => setIsLoading(false));
  }, [activeTab, searchQuery]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview(null);
    setFormError("");
    setShowForm(true);
  }

  function openEdit(item) {
    setForm({
      id: item.id,
      name: item.name,
      sku: item.sku,
      category: item.category,
      description: item.description ?? "",
      selling_price_ks: item.selling_price_ks,
      cost_price_ks: item.cost_price_ks ?? "",
      stock_qty: item.stock_qty,
      reorder_level: item.reorder_level,
      expiry_date: item.expiry_date ? item.expiry_date.slice(0, 10) : "",
    });
    setImageFile(null);
    setImagePreview(item.image_url);
    setFormError("");
    setShowForm(true);
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    setFormError("");

    if (!form.name.trim() || !form.category || !form.selling_price_ks) {
      setFormError("Name, category, and selling price are required.");
      return;
    }

    const body = new FormData();
    if (form.id) body.append("id", form.id);
    body.append("name", form.name.trim());
    if (form.sku.trim()) body.append("sku", form.sku.trim());
    body.append("category", form.category);
    body.append("description", form.description.trim());
    body.append("selling_price_ks", form.selling_price_ks);
    body.append("cost_price_ks", form.cost_price_ks || "");
    body.append("stock_qty", form.stock_qty || "0");
    if (form.reorder_level !== "") body.append("reorder_level", form.reorder_level);
    body.append("expiry_date", form.expiry_date);
    if (imageFile) body.append("image", imageFile);

    setSaving(true);
    const result = await fetch("/api/admin/medicines", {
      method: form.id ? "PATCH" : "POST",
      body,
    }).then((r) => r.json());
    setSaving(false);

    if (!result.success) {
      setFormError(result.message ?? "Could not save product");
      return;
    }
    setShowForm(false);
    loadItems();
  }

  // Soft-delete, not a hard DELETE — see the comment on the PATCH route's
  // is_active handling. The product's order/sale history stays intact;
  // it just stops appearing here and on the storefront. There's currently
  // no "show deactivated items" view to undo this from — re-adding via
  // "Add Product" (or a direct DB edit) is the only way back.
  async function handleDeactivate(item) {
    if (!window.confirm(`Remove "${item.name}" from the catalog? It will stop appearing on the site and here.`)) {
      return;
    }
    setDeactivatingId(item.id);
    const body = new FormData();
    body.append("id", item.id);
    body.append("is_active", "false");
    const result = await fetch("/api/admin/medicines", { method: "PATCH", body }).then((r) => r.json());
    setDeactivatingId(null);
    if (!result.success) {
      window.alert(result.message ?? "Could not remove product");
      return;
    }
    loadItems();
  }

  // Fixed, not derived from `items` — `items` is the currently *filtered*
  // result set (loadItems() passes activeTab as a `category` query param),
  // so deriving tabs from it made every other category's tab disappear the
  // moment you clicked one (items would only contain that one category).
  const categories = ["All Items", ...CATEGORIES];

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => Number(a.stock_qty) - Number(b.stock_qty) || a.id - b.id),
    [items]
  );

  const lowStockItems = useMemo(
    () => sortedItems.filter((item) => item.status === "low" || item.stock_qty <= item.reorder_level),
    [sortedItems]
  );

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedItems.slice(indexOfFirstItem, indexOfLastItem);

  // Ellipsis-truncated page list (e.g. 1,2,3…26,27,28) instead of rendering
  // every page number — with 5 items/page a large catalog produces dozens
  // of pages, which used to overflow into one long cramped row.
  const pageNumbers = useMemo(() => {
    const siblingCount = 1;
    const totalVisible = siblingCount * 2 + 5; // first + last + current + 2 siblings + 2 ellipsis slots
    if (totalVisible >= totalPages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSibling = Math.max(currentPage - siblingCount, 1);
    const rightSibling = Math.min(currentPage + siblingCount, totalPages);
    const showLeftEllipsis = leftSibling > 2;
    const showRightEllipsis = rightSibling < totalPages - 1;

    if (!showLeftEllipsis && showRightEllipsis) {
      const leftRange = Array.from({ length: 3 + 2 * siblingCount }, (_, i) => i + 1);
      return [...leftRange, "…", totalPages];
    }
    if (showLeftEllipsis && !showRightEllipsis) {
      const count = 3 + 2 * siblingCount;
      const rightRange = Array.from({ length: count }, (_, i) => totalPages - count + i + 1);
      return [1, "…", ...rightRange];
    }
    const middleRange = Array.from({ length: rightSibling - leftSibling + 1 }, (_, i) => leftSibling + i);
    return [1, "…", ...middleRange, "…", totalPages];
  }, [currentPage, totalPages]);

  const stats = useMemo(() => {
    const outOfStockCount = sortedItems.filter((item) => Number(item.stock_qty) === 0).length;
    const totalValue = sortedItems.reduce(
      (acc, item) => acc + Number(item.selling_price_ks || 0) * Number(item.stock_qty || 0),
      0
    );
    return {
      totalItems: sortedItems.length,
      lowStockCount: lowStockItems.length,
      outOfStockCount,
      totalValue,
    };
  }, [sortedItems, lowStockItems]);

  const formatKyat = (val) => `${new Intl.NumberFormat("en-MM").format(Number(val || 0))} MMK`;

  return (
    <div>
      <header className="mb-10 flex items-center justify-between">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/10"
            placeholder="ဆေးအမည် သို့မဟုတ် SKU ဖြင့် ရှာဖွေရန်..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black uppercase text-white shadow-md shadow-blue-100 hover:bg-blue-700"
        >
          <PackagePlus size={16} /> Add Product
        </button>
      </header>

      <div className="mb-8 grid grid-cols-4 gap-6">
        {[
          { label: "စုစုပေါင်းပစ္စည်း", val: stats.totalItems, icon: <Layers className="text-blue-500" />, color: "bg-blue-50" },
          { label: "စတော့ကုန်", val: stats.outOfStockCount, icon: <AlertCircle className="text-red-500" />, color: "bg-red-50" },
          { label: "စတော့နည်း", val: stats.lowStockCount, icon: <AlertTriangle className="text-orange-500" />, color: "bg-orange-50" },
          { label: "စတော့တန်ဖိုး (MMK)", val: formatKyat(stats.totalValue), icon: <Banknote className="text-emerald-500" />, color: "bg-emerald-500/10" },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-5 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
            <div className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ${stat.color}`}>{stat.icon}</div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
              <p className="text-2xl font-black tracking-tighter text-slate-900">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8 overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
        <div className="flex border-b border-slate-100 px-8">
          {categories.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 px-6 pb-4 pt-6 text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {lowStockItems.length > 0 && (
          <div className="mx-8 mt-6 rounded-3xl border border-red-200 bg-red-50 px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-2xl bg-white p-2 text-red-500 shadow-sm">
                <AlertTriangle size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-red-700">
                  Low stock alert: {lowStockItems.length} item(s)
                </p>
                <p className="mt-1 text-xs font-semibold leading-6 text-red-600">
                  {lowStockItems.slice(0, 6).map((item) => `${item.name} (${item.stock_qty})`).join(" • ")}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="min-h-[420px] overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                <th className="px-8 py-5">ပစ္စည်းအသေးစိတ်</th>
                <th className="px-6 py-5">SKU</th>
                <th className="px-6 py-5">အမျိုးအစား</th>
                <th className="px-6 py-5">စတော့</th>
                <th className="px-6 py-5">ဈေးနှုန်း (MMK)</th>
                <th className="px-6 py-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center font-bold text-slate-400">
                    ကုန်ပစ္စည်းစာရင်းကို ရယူနေသည်...
                  </td>
                </tr>
              )}
              {!isLoading && error && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center font-bold text-red-500">{error}</td>
                </tr>
              )}
              {!isLoading && !error && currentItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center font-bold text-slate-400">ကုန်ပစ္စည်းမတွေ့ပါ။</td>
                </tr>
              )}
              {!isLoading &&
                !error &&
                currentItems.map((item) => {
                  const ratio = item.reorder_level > 0 ? Math.min(100, (item.stock_qty / (item.reorder_level * 2)) * 100) : 100;
                  const lowStock = item.status === "low" || item.stock_qty <= item.reorder_level;
                  return (
                    <tr key={item.id} className="group transition-colors hover:bg-slate-50/50">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                            <Pill size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800">{item.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-xs font-bold text-slate-500">{item.sku}</td>
                      <td className="px-6 py-5">
                        <span className="rounded-lg bg-blue-100 px-3 py-1 text-[10px] font-black uppercase text-blue-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                            <div className={`h-full ${lowStock ? "bg-red-500" : "bg-emerald-500"}`} style={{ width: `${ratio}%` }} />
                          </div>
                          <p className={`text-[10px] font-black ${lowStock ? "text-red-500" : "text-slate-500"}`}>{item.stock_qty}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-black text-slate-900">{formatKyat(item.selling_price_ks)}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-200"
                          >
                            <Pencil size={14} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeactivate(item)}
                            disabled={deactivatingId === item.id}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-xs font-black text-red-600 hover:bg-red-100 disabled:opacity-50"
                          >
                            <Trash2 size={14} /> {deactivatingId === item.id ? "Removing…" : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-50 bg-slate-50/20 px-8 py-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            စုစုပေါင်း {sortedItems.length} ခုအနက် {sortedItems.length === 0 ? 0 : indexOfFirstItem + 1} မှ{" "}
            {Math.min(indexOfLastItem, sortedItems.length)} အထိ ပြထားသည်
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                  onClick={() => setCurrentPage(pageNum)}
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
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`rounded-lg border border-slate-200 p-2 transition-all ${
                currentPage === totalPages ? "cursor-not-allowed opacity-20" : "shadow-sm hover:bg-white hover:text-blue-600"
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">{form.id ? "Edit Product" : "Add Product"}</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700">
                <XIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-100">
                  {imagePreview ? (
                    <Image src={imagePreview} alt="Preview" fill className="object-contain" unoptimized={imageFile != null} />
                  ) : (
                    <span className="text-[10px] font-bold text-slate-300">No image</span>
                  )}
                </div>
                <label className="flex-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Product Image</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="mt-1 block w-full text-xs" />
                </label>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">SKU (optional)</label>
                  <input
                    type="text"
                    placeholder="Auto-generated if blank"
                    value={form.sku}
                    onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selling Price (MMK)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.selling_price_ks}
                    onChange={(e) => setForm((f) => ({ ...f, selling_price_ks: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Cost Price (MMK) <span className="text-purple-500">&middot; Admin only</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Optional"
                    value={form.cost_price_ks}
                    onChange={(e) => setForm((f) => ({ ...f, cost_price_ks: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-purple-100 bg-purple-50/40 p-3 text-sm outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stock Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock_qty}
                    onChange={(e) => setForm((f) => ({ ...f, stock_qty: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reorder Level</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Default"
                    value={form.reorder_level}
                    onChange={(e) => setForm((f) => ({ ...f, reorder_level: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expiry Date</label>
                  <div className="mt-1">
                    <DatePicker
                      value={form.expiry_date}
                      onChange={(iso) => setForm((f) => ({ ...f, expiry_date: iso }))}
                      placeholder="No expiry set"
                    />
                  </div>
                </div>
              </div>

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
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
                  {saving ? "Saving..." : form.id ? "Save Changes" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
