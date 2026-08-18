"use client";

import { useEffect } from "react";
import { CheckCircle, XCircle } from "lucide-react";

export type ToastState = { type: "success" | "error"; message: string } | null;

/**
 * Standalone success/error toast — same fixed-bottom-pill look as
 * CartToast.tsx, but self-contained (own auto-dismiss timer, no
 * CartContext dependency) and typed so callers get a distinct color/icon
 * for success vs. error instead of one neutral message.
 */
export default function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === "success";

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-2xl ${
        isSuccess ? "bg-emerald-600" : "bg-red-600"
      }`}
    >
      {isSuccess ? <CheckCircle size={18} /> : <XCircle size={18} />}
      {toast.message}
    </div>
  );
}
