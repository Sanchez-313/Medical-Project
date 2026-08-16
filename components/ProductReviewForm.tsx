"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Star } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageContext";

export default function ProductReviewForm({ medicineId }: { medicineId: number }) {
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: "error" | "success"; message: string } | null>(null);

  if (!session?.user) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center text-sm text-slate-500">
        <Link href="/login" className="font-bold text-blue-600 hover:underline">
          {t("reviewForm.signIn")}
        </Link>{" "}
        {t("reviewForm.signInPrompt")}
      </div>
    );
  }

  async function handleSubmit() {
    if (rating === 0) {
      setNotice({ type: "error", message: t("reviewForm.selectRating") });
      return;
    }
    setSubmitting(true);
    setNotice(null);
    const result = await fetch(`/api/products/${medicineId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment }),
    }).then((r) => r.json());
    setSubmitting(false);

    if (!result.success) {
      setNotice({ type: "error", message: result.message ?? "Could not submit review." });
      return;
    }
    setNotice({ type: "success", message: t("reviewForm.success") });
    setComment("");
    setRating(0);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6">
      <p className="text-sm font-black uppercase tracking-widest text-slate-400">{t("reviewForm.heading")}</p>

      <div className="mt-3 flex items-center gap-3">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              aria-label={`${star} star`}
              className="text-2xl"
            >
              <Star
                size={26}
                className={(hoverRating || rating) >= star ? "fill-amber-400 text-amber-400" : "text-slate-300"}
              />
            </button>
          ))}
        </div>
        <span className="text-sm font-semibold text-slate-500">
          {rating > 0 ? `${rating} ${t("reviewForm.ratingOf5")}` : t("reviewForm.noRating")}
        </span>
        {rating > 0 && (
          <button
            type="button"
            onClick={() => setRating(0)}
            className="text-sm font-semibold text-slate-400 underline hover:text-slate-600"
          >
            {t("reviewForm.clearRating")}
          </button>
        )}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder={t("reviewForm.placeholder")}
        className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50"
      />

      {notice && (
        <p className={`mt-3 text-sm font-semibold ${notice.type === "error" ? "text-red-600" : "text-emerald-600"}`}>
          {notice.message}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-4 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-100 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? t("reviewForm.submitting") : t("reviewForm.submit")}
      </button>
    </div>
  );
}
