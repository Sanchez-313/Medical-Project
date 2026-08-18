"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Megaphone, Plus, Trash2, GripVertical } from "lucide-react";

const EMPTY_FORM = { title: "", description: "", title_my: "", description_my: "", link_url: "", sort_order: "0" };

export default function AdvertisementsPage() {
  const [ads, setAds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  function loadAds() {
    setIsLoading(true);
    return fetch("/api/admin/advertisements")
      .then((r) => r.json())
      .then((result) => setAds(result.success ? result.data : []))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadAds();
  }, []);

  function handleImageChange(e) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError("");

    if (!form.title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (!imageFile) {
      setFormError("An image is required.");
      return;
    }

    const body = new FormData();
    body.append("title", form.title.trim());
    body.append("description", form.description.trim());
    body.append("title_my", form.title_my.trim());
    body.append("description_my", form.description_my.trim());
    body.append("link_url", form.link_url.trim());
    body.append("sort_order", form.sort_order || "0");
    body.append("image", imageFile);

    setSaving(true);
    const result = await fetch("/api/admin/advertisements", { method: "POST", body }).then((r) => r.json());
    setSaving(false);

    if (!result.success) {
      setFormError(result.message ?? "Could not create slide");
      return;
    }
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview(null);
    setShowForm(false);
    loadAds();
  }

  async function toggleActive(ad) {
    await fetch(`/api/admin/advertisements/${ad.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !ad.is_active }),
    });
    loadAds();
  }

  async function deleteAd(ad) {
    if (!confirm(`Delete the "${ad.title}" slide?`)) return;
    await fetch(`/api/admin/advertisements/${ad.id}`, { method: "DELETE" });
    loadAds();
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Advertisements</h1>
          <p className="pt-3 text-slate-500">Slideshow shown on the storefront home page, right below the hero.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-blue-100 hover:bg-blue-700"
        >
          <Plus size={18} /> Add Slide
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading && <p className="text-sm text-slate-400">Loading...</p>}
        {!isLoading && ads.length === 0 && (
          <div className="rounded-[2rem] border border-slate-100 bg-white p-10 text-center text-sm text-slate-500">
            No slides yet — add one to start the home page slideshow.
          </div>
        )}
        {ads.map((ad) => (
          <div key={ad.id} className="flex items-center gap-5 rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
            <GripVertical className="shrink-0 text-slate-300" size={18} />
            <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100">
              <Image src={ad.image_url} alt={ad.title} fill className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-black text-slate-800">{ad.title}</p>
              {ad.description && <p className="truncate text-xs text-slate-500">{ad.description}</p>}
              <p className="truncate text-xs text-slate-400">{ad.link_url || "No link"}</p>
            </div>
            <span className="shrink-0 text-xs font-bold text-slate-400">Order {ad.sort_order}</span>
            <button
              type="button"
              onClick={() => toggleActive(ad)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase ${
                ad.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {ad.is_active ? "Active" : "Disabled"}
            </button>
            <button
              type="button"
              onClick={() => deleteAd(ad)}
              className="shrink-0 text-slate-300 hover:text-red-500"
              aria-label="Delete slide"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          {/* max-h + overflow-y-auto so the EN+MY form scrolls internally on
              shorter viewports instead of overflowing past the screen with
              the Save/Cancel buttons unreachable. */}
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-[2rem] bg-white shadow-2xl">
            <div className="flex shrink-0 items-center gap-3 p-8 pb-0">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
                <Megaphone size={18} />
              </div>
              <h3 className="text-xl font-black text-slate-900">Add Slide</h3>
            </div>

            <form onSubmit={handleCreate} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-8">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Title (English)</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Summer Sale — 20% Off Vitamins"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Description (English, optional)
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Find everything from daily supplements to specialized treatments, all verified and ready for delivery."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50"
                />
              </div>

              <div className="rounded-xl border border-dashed border-slate-200 p-3 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                  Myanmar (optional — falls back to English if left blank)
                </p>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Title (Myanmar)</label>
                  <input
                    type="text"
                    value={form.title_my}
                    onChange={(e) => setForm((f) => ({ ...f, title_my: e.target.value }))}
                    placeholder="နွေရာသီအထူးလျှော့စျေး — ဗီတာမင် ၂၀% လျှော့ချ"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Description (Myanmar)
                  </label>
                  <textarea
                    rows={2}
                    value={form.description_my}
                    onChange={(e) => setForm((f) => ({ ...f, description_my: e.target.value }))}
                    placeholder="နေ့စဉ်သုံးအားဆေးများမှသည် အထူးကုသရေးဆေးဝါးများအထိ ရှာဖွေနိုင်ပါသည်။"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Link (optional)
                </label>
                <input
                  type="text"
                  value={form.link_url}
                  onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
                  placeholder="/products?category=Medical%20Equipment"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sort Order</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50"
                />
                <p className="mt-1 text-xs text-slate-400">Lower numbers show first.</p>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Image</label>
                <div className="mt-1 flex items-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 p-4">
                  {imagePreview ? (
                    <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg">
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" unoptimized />
                    </div>
                  ) : (
                    <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-xs text-slate-400">
                      No image
                    </div>
                  )}
                  <label className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                    Choose File
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
                  </label>
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
                  className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-100 hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Add Slide"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
