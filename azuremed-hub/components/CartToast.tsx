"use client";

import { useCart } from "@/components/CartContext";

export default function CartToast() {
  const { toast } = useCart();
  if (!toast) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-2xl">
      {toast}
    </div>
  );
}
