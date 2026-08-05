"use client";

import Image from "next/image";

const LOW_STOCK_THRESHOLD = 20;

type ConfidenceStatus = "HIGH_CONFIDENCE" | "MEDIUM_CONFIDENCE" | "LOW_CONFIDENCE" | "NO_MATCH";

export interface MedicineDetail {
  id: string | null;
  name: string;
  expireDate: string | null;
  stock: { quantity: number; unit: string };
  about: string | null;
  howToUse: string | null;
  matched: boolean;
  category: string | null;
  imageUrl: string | null;
  priceKs: number | null;
}

export interface DetectionResult {
  detection: { predictedClass: string | null; confidence: number; status: ConfidenceStatus };
  medicineDetail: MedicineDetail | null;
  topMatches: Array<{ label: string; confidence: number }>;
}

const STATUS_STYLES: Record<ConfidenceStatus, string> = {
  HIGH_CONFIDENCE: "bg-emerald-100 text-emerald-700",
  MEDIUM_CONFIDENCE: "bg-amber-100 text-amber-700",
  LOW_CONFIDENCE: "bg-orange-100 text-orange-700",
  NO_MATCH: "bg-slate-100 text-slate-500",
};

const STATUS_LABELS: Record<ConfidenceStatus, string> = {
  HIGH_CONFIDENCE: "High confidence",
  MEDIUM_CONFIDENCE: "Medium confidence",
  LOW_CONFIDENCE: "Low confidence",
  NO_MATCH: "No match",
};

export default function MedicineDetectionCard({
  result,
  onAddToCart,
}: {
  result: DetectionResult;
  onAddToCart?: () => void;
}) {
  const { detection, medicineDetail, topMatches } = result;
  const accuracyPct = Math.round(detection.confidence * 100);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start gap-4 border-b border-slate-100 p-5 dark:border-slate-800">
        {medicineDetail?.matched && (
          <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-800">
            {medicineDetail.imageUrl ? (
              <Image src={medicineDetail.imageUrl} alt={medicineDetail.name} fill className="object-contain" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">No photo</div>
            )}
          </div>
        )}
        <div className="flex flex-1 items-start justify-between gap-4">
          <div>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {medicineDetail?.name ?? detection.predictedClass ?? "No prediction"}
            </p>
            {medicineDetail?.expireDate && (
              <p className="mt-0.5 text-xs text-slate-500">Expires {medicineDetail.expireDate}</p>
            )}
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[detection.status]}`}>
            {STATUS_LABELS[detection.status]} · {accuracyPct}%
          </span>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {!medicineDetail && detection.status !== "NO_MATCH" && (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            The AI isn&apos;t confident enough to look this up in the catalog yet. Try a clearer, closer photo.
          </p>
        )}

        {medicineDetail && !medicineDetail.matched && (
          <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-700">
            Recognized as <span className="font-semibold">{medicineDetail.name}</span>, but it isn&apos;t in our
            catalog yet — no stock, pricing, or description on file.
          </p>
        )}

        {medicineDetail?.matched && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">Stock</span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  medicineDetail.stock.quantity < LOW_STOCK_THRESHOLD
                    ? "bg-red-100 text-red-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {medicineDetail.stock.quantity} {medicineDetail.stock.unit}
                {medicineDetail.stock.quantity < LOW_STOCK_THRESHOLD ? " · Low stock" : ""}
              </span>
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-slate-500">About</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {medicineDetail.about ?? "No description on file for this product."}
              </p>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-bold uppercase tracking-wide text-blue-700">How to Use</p>
              <p className="mt-1 text-sm text-blue-800">
                {medicineDetail.howToUse ??
                  "Usage instructions aren't stored in our catalog. Please check the product packaging or ask a pharmacist before use."}
              </p>
            </div>

            {onAddToCart && (
              <button
                type="button"
                onClick={onAddToCart}
                disabled={medicineDetail.stock.quantity <= 0}
                className="w-full rounded-full bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add to Cart
              </button>
            )}
          </>
        )}

        {topMatches.length > 0 && (
          <details className="rounded-xl border border-slate-100 dark:border-slate-800">
            <summary className="cursor-pointer px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-500">
              Other possible matches
            </summary>
            <ul className="space-y-1 px-4 pb-3">
              {topMatches.map((match) => (
                <li key={match.label} className="flex justify-between text-xs text-slate-500">
                  <span>{match.label}</span>
                  <span>{Math.round(match.confidence * 100)}%</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}
