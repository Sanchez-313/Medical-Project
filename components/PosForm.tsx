"use client";

import { useState } from "react";

interface Medicine {
  id: number;
  name: string;
  selling_price_ks: number;
  stock_qty: number;
}

export default function PosForm({
  medicines,
  endpoint = "/api/portal/sales",
}: {
  medicines: Medicine[];
  endpoint?: string;
}) {
  const [cart, setCart] = useState<Record<number, number>>({});
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function setQty(medicineId: number, qty: number) {
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[medicineId];
      else next[medicineId] = qty;
      return next;
    });
  }

  async function handleCheckout() {
    const items = Object.entries(cart).map(([medicineId, qty]) => ({
      medicineId: Number(medicineId),
      qty,
    }));
    if (!items.length) {
      setStatus("Add at least one item first.");
      return;
    }

    setSubmitting(true);
    setStatus(null);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerName, paymentMethod, items }),
    });
    const result = await response.json();
    setSubmitting(false);

    if (!result.success) {
      setStatus(`Error: ${result.message}`);
      return;
    }

    setStatus(`Sale ${result.data.saleCode} recorded — total ${result.data.totalKs.toLocaleString()} Ks`);
    setCart({});
    setCustomerName("");
  }

  return (
    <div className="space-y-4 rounded border p-4">
      <h2 className="text-lg font-medium">Checkout</h2>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          placeholder="Customer name (optional)"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="flex-1 rounded border px-3 py-2 text-sm"
        />
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="mobile">Mobile Payment</option>
        </select>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="py-2">Medicine</th>
            <th>Price (Ks)</th>
            <th>Stock</th>
            <th>Qty</th>
          </tr>
        </thead>
        <tbody>
          {medicines.map((medicine) => (
            <tr key={medicine.id} className="border-t border-slate-200 dark:border-slate-800">
              <td className="py-2">{medicine.name}</td>
              <td>{Number(medicine.selling_price_ks).toLocaleString()}</td>
              <td>{medicine.stock_qty}</td>
              <td>
                <input
                  type="number"
                  min={0}
                  max={medicine.stock_qty}
                  value={cart[medicine.id] ?? 0}
                  onChange={(e) => setQty(medicine.id, Number(e.target.value))}
                  className="w-16 rounded border px-2 py-1"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {status && <p className="text-sm">{status}</p>}

      <button
        type="button"
        onClick={handleCheckout}
        disabled={submitting}
        className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {submitting ? "Processing..." : "Complete Sale"}
      </button>
    </div>
  );
}
