"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartContext";
import MedicineDetectionCard, { type DetectionResult } from "@/components/MedicineDetectionCard";

type Status = "idle" | "analyzing" | "done" | "error";

const STEPS = [
  "Open the camera or upload a clear photo of the medicine pack.",
  "Capture the image and let the AI rank the best matching labels.",
  "Review the matched storefront product, confidence, and stock status.",
];

export default function DetectMedicinePage() {
  const { addToCart } = useCart();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionResult | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((session) => {
        setIsAuthed(Boolean(session?.user));
        setAuthChecked(true);
      });
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      // Don't attach to videoRef.current here — the <video> element only
      // mounts once cameraActive flips true (it's behind that conditional
      // below), so the ref is still null at this point. The effect below
      // attaches the stream once the element actually exists.
      setCameraActive(true);
    } catch {
      setErrorMessage("Camera access was denied or is unavailable. You can still upload a photo instead.");
    }
  }

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {
        setErrorMessage("Could not start the camera preview. You can still upload a photo instead.");
      });
    }
  }, [cameraActive]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  }

  function captureFromCamera() {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
        handleFile(file);
      }
    }, "image/jpeg", 0.92);
    stopCamera();
  }

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please choose an image file (JPEG, PNG, or WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Image must be under 5MB.");
      return;
    }
    setErrorMessage(null);
    setResult(null);
    setStatus("idle");
    setPreviewUrl(URL.createObjectURL(file));
    void detect(file);
  }

  async function detect(file: File) {
    setStatus("analyzing");
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/ai/detect", { method: "POST", body: formData });
      const body = await response.json();

      if (!body.success) {
        setStatus("error");
        setErrorMessage(body.message ?? "Detection failed.");
        return;
      }

      setResult(body.data);
      setStatus("done");
    } catch {
      setStatus("error");
      setErrorMessage("Network error while contacting the AI service.");
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function clearPreview() {
    setPreviewUrl(null);
    setResult(null);
    setStatus("idle");
    setErrorMessage(null);
  }

  if (authChecked && !isAuthed) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Sign in required</h1>
        <p className="mt-2 text-slate-500">
          Create a free account to use AI medicine detection.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 pt-32 pb-12 sm:px-10">
      <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">Detect Medicine</h1>
      <p className="mt-2 text-slate-500">
        Upload or capture a photo of a medicine pack, strip, or bottle for live AI detection.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Capture / upload panel */}
        <div className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`relative flex h-80 flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed text-center transition ${
              dragActive ? "border-brand bg-blue-50" : "border-brand-muted bg-slate-900"
            }`}
          >
            {cameraActive ? (
              <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
            ) : previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Captured medicine" className="h-full w-full object-contain bg-white" />
            ) : (
              <div className="px-6 text-slate-300">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-slate-600">
                  📷
                </div>
                <p className="font-semibold">Camera preview</p>
                <p className="mt-1 text-sm text-slate-400">
                  Start the camera or drag a medicine photo here for live capture and AI detection.
                </p>
              </div>
            )}

            {status === "analyzing" && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70">
                <div className="flex items-center gap-3 text-white">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Analyzing image...
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {!cameraActive ? (
              <button
                type="button"
                onClick={startCamera}
                className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Start Camera
              </button>
            ) : (
              <button
                type="button"
                onClick={captureFromCamera}
                className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                Capture + Detect
              </button>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full border border-brand-muted px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Upload Photo
            </button>
            {(previewUrl || cameraActive) && (
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  clearPreview();
                }}
                className="rounded-full border border-transparent px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                Clear Preview
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
            />
          </div>

          {errorMessage && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>
          )}
        </div>

        {/* Guidance + result panel */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-brand-muted bg-white p-5 dark:bg-slate-900">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              How users will use it
            </h2>
            <ol className="mt-3 space-y-3">
              {STEPS.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-brand-muted bg-white p-5 dark:bg-slate-900">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Detection Result</h2>

            {status === "idle" && (
              <p className="mt-3 text-sm text-slate-400">
                Capture or upload a medicine image to see live AI predictions here.
              </p>
            )}

            {status === "analyzing" && (
              <div className="mt-3 space-y-2 animate-pulse">
                <div className="h-4 w-2/3 rounded bg-slate-200" />
                <div className="h-4 w-1/2 rounded bg-slate-200" />
                <div className="h-4 w-1/3 rounded bg-slate-200" />
              </div>
            )}

            {status === "error" && (
              <p className="mt-3 text-sm text-red-600">Could not complete detection. Try again.</p>
            )}

            {status === "done" && result && (
              <div className="mt-3">
                <MedicineDetectionCard
                  result={result}
                  onAddToCart={
                    result.medicineDetail?.matched
                      ? () => {
                          const detail = result.medicineDetail!;
                          addToCart({
                            id: Number(detail.id),
                            name: detail.name,
                            category: detail.category ?? "",
                            image_url: detail.imageUrl,
                            price: detail.priceKs ?? 0,
                          });
                        }
                      : undefined
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
