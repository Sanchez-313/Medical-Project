"use client";

import { useEffect, useState } from "react";
import { Settings2, Plus, Trash2, Tag } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState("");
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState("");

  const [promoCodes, setPromoCodes] = useState([]);
  const [newCode, setNewCode] = useState("");
  const [newDiscount, setNewDiscount] = useState("");
  const [promoError, setPromoError] = useState("");
  const [creatingPromo, setCreatingPromo] = useState(false);

  function loadSettings() {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((result) => {
        if (result.success) {
          setSettings(result.data);
          setDeliveryFee(String(result.data.delivery_fee_ks));
          setFreeDeliveryThreshold(String(result.data.free_delivery_threshold_ks));
          setLowStockThreshold(String(result.data.low_stock_default_threshold));
        }
      });
  }

  function loadPromoCodes() {
    fetch("/api/admin/promo-codes")
      .then((r) => r.json())
      .then((result) => setPromoCodes(result.success ? result.data : []));
  }

  useEffect(() => {
    loadSettings();
    loadPromoCodes();
  }, []);

  async function saveSettings(e) {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsNotice("");
    const result = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        delivery_fee_ks: Number(deliveryFee),
        free_delivery_threshold_ks: Number(freeDeliveryThreshold),
        low_stock_default_threshold: Number(lowStockThreshold),
      }),
    }).then((r) => r.json());
    setSavingSettings(false);

    if (!result.success) {
      setSettingsNotice(result.message ?? "Could not save settings");
      return;
    }
    setSettingsNotice("Saved.");
    loadSettings();
  }

  async function createPromoCode(e) {
    e.preventDefault();
    setPromoError("");
    setCreatingPromo(true);
    const result = await fetch("/api/admin/promo-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: newCode, discount_percent: Number(newDiscount) }),
    }).then((r) => r.json());
    setCreatingPromo(false);

    if (!result.success) {
      setPromoError(result.message ?? "Could not create promo code");
      return;
    }
    setNewCode("");
    setNewDiscount("");
    loadPromoCodes();
  }

  async function toggleActive(promo) {
    await fetch(`/api/admin/promo-codes/${promo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !promo.is_active }),
    });
    loadPromoCodes();
  }

  async function deletePromoCode(promo) {
    if (!confirm(`Delete promo code ${promo.code}?`)) return;
    await fetch(`/api/admin/promo-codes/${promo.id}`, { method: "DELETE" });
    loadPromoCodes();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">Settings</h1>
        <p className="pt-3 text-slate-500">Delivery fee, low-stock alert threshold, and promo codes.</p>
      </div>

      {/* items-start: grid items stretch to match the tallest sibling by
          default, so adding the Free Delivery Threshold field to Storefront
          Settings (taller now) was also stretching the shorter Promo Codes
          card to match, leaving a big empty gap under "No promo codes yet." */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
              <Settings2 size={18} />
            </div>
            <h2 className="font-black text-slate-900">Storefront Settings</h2>
          </div>

          {settings === null ? (
            <p className="text-sm text-slate-400">Loading...</p>
          ) : (
            <form onSubmit={saveSettings} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Delivery Fee (MMK)
                </label>
                <input
                  type="number"
                  min="0"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50"
                />
                <p className="mt-1 text-xs text-slate-400">Applied to every storefront checkout. Set to 0 for free delivery.</p>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Free Delivery Threshold (MMK)
                </label>
                <input
                  type="number"
                  min="0"
                  value={freeDeliveryThreshold}
                  onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Orders at or above this subtotal get the delivery fee waived. Set to 0 to always charge the fee above.
                </p>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Default Low-Stock Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Used automatically whenever Staff add a new product without setting a reorder level themselves.
                </p>
              </div>

              {settingsNotice && <p className="text-sm font-semibold text-emerald-600">{settingsNotice}</p>}

              <button
                type="submit"
                disabled={savingSettings}
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-100 hover:bg-blue-700 disabled:opacity-50"
              >
                {savingSettings ? "Saving..." : "Save Settings"}
              </button>
            </form>
          )}
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
              <Tag size={18} />
            </div>
            <h2 className="font-black text-slate-900">Promo Codes</h2>
          </div>

          <form onSubmit={createPromoCode} className="mb-4 flex items-end gap-2">
            <div className="flex-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Code</label>
              <input
                type="text"
                required
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="SAVE10"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50"
              />
            </div>
            <div className="w-24">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">% Off</label>
              <input
                type="number"
                required
                min="1"
                max="100"
                value={newDiscount}
                onChange={(e) => setNewDiscount(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50"
              />
            </div>
            <button
              type="submit"
              disabled={creatingPromo}
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              aria-label="Add promo code"
            >
              <Plus size={18} />
            </button>
          </form>
          {promoError && <p className="mb-4 text-sm text-red-600">{promoError}</p>}

          <div className="space-y-2">
            {promoCodes.length === 0 && <p className="text-sm text-slate-400">No promo codes yet.</p>}
            {promoCodes.map((promo) => (
              <div key={promo.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
                <div>
                  <p className="text-sm font-black text-slate-800">{promo.code}</p>
                  <p className="text-xs font-semibold text-slate-400">{promo.discount_percent}% off</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleActive(promo)}
                    className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase ${
                      promo.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {promo.is_active ? "Active" : "Disabled"}
                  </button>
                  <button
                    type="button"
                    onClick={() => deletePromoCode(promo)}
                    className="text-slate-300 hover:text-red-500"
                    aria-label="Delete promo code"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
