import React, { useEffect, useCallback, useRef, useState } from "react";
import {
  Camera,
  Upload,
  ScanSearch,
  ShieldCheck,
  Cpu,
  Pill,
  RefreshCw,
  CircleAlert,
  CheckCircle2,
  Sparkles,
  LoaderCircle,
} from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { detectMedicineImage, loadMedicineDetector } from "../../lib/medicineAi";
import { requestJson } from "../../lib/api";
import { mapApiProduct } from "../../lib/productCatalog";
import { getDetectedMedicineDetails, getProductUsageDetails } from "../../lib/productUsage";

const MIN_CONFIDENCE = 0.7;

const DetectMedicine = () => {
  const outletContext = useOutletContext() || {};
  const getDatabaseStock = outletContext.getDatabaseStock;
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const resultImageRef = useRef(null);
  const detectionResultRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [modelMeta, setModelMeta] = useState(null);
  const [modelReady, setModelReady] = useState(false);
  const [modelError, setModelError] = useState("");
  const [detectorUnavailable, setDetectorUnavailable] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionError, setDetectionError] = useState("");
  const [detectionResult, setDetectionResult] = useState(null);
  const [previewNeedsDetection, setPreviewNeedsDetection] = useState(false);
  const [databaseProduct, setDatabaseProduct] = useState(null);
  const [databaseProductError, setDatabaseProductError] = useState("");
  const [previewSource, setPreviewSource] = useState("");

  const syncDetectedProductToDatabase = async (product) => {
    const payload = await requestJson("/api/products/detected", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        stock: product.stock ?? 0,
        expiryDate: product.expiryDate || "",
        description: product.description || "",
        image_url: "",
      }),
    });

    return mapApiProduct(payload?.data?.product || {});
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const resetDetection = () => {
    setDetectionResult(null);
    setDetectionError("");
  };

  const resetMatchedProductState = () => {
    setDatabaseProduct(null);
    setDatabaseProductError("");
  };

  const preparePreviewDetection = () => {
    resetDetection();
    resetMatchedProductState();
    setPreviewNeedsDetection(true);
  };

  const startCamera = async () => {
    try {
      setCameraError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });

      stopCamera();
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);
    } catch (error) {
      const name = error?.name || "";
      if (name === "NotAllowedError") {
        setCameraError("Camera permission is blocked. Please allow camera access in your browser.");
      } else if (name === "NotFoundError") {
        setCameraError("No camera was found on this device.");
      } else {
        setCameraError("The camera could not be started right now.");
      }
      setCameraActive(false);
    }
  };

  const runDetection = async (source) => {
    if (!source) return;

    setIsDetecting(true);
    setDetectionError("");
    setDetectionResult(null);
    resetMatchedProductState();

    try {
      const result = await detectMedicineImage(source, {
        minConfidence: MIN_CONFIDENCE,
      });

      setDetectionResult(result);

      if (!result.bestPrediction || result.bestPrediction.confidence < MIN_CONFIDENCE) {
        setDetectionError("The AI could not identify this medicine confidently. Try a clearer, front-facing photo.");
      }
    } catch (error) {
      setDetectionError(error?.message || "AI detection failed for this image.");
    } finally {
      setIsDetecting(false);
    }
  };

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");
    stopCamera();
    setPreviewSource("camera");
    preparePreviewDetection();
    setPreviewImage(dataUrl);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewSource("upload");
      preparePreviewDetection();
      setPreviewImage(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

 const activateCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      setCameraActive(true);
      
      // Give the camera a brief moment to warm up/render
      return new Promise((resolve) => {
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          resolve(true);
        };
      });
    }
  } catch (err) {
    console.error("Camera access denied", err);
    return false;
  }
};

  const detectPreviewImage = () => {
    if (!previewImage) return;
    preparePreviewDetection();
  };

  const clearPreview = () => {
    setPreviewImage("");
    setPreviewNeedsDetection(false);
    setPreviewSource("");
    resetDetection();
    resetMatchedProductState();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    let ignore = false;

    const loadModelMeta = async () => {
      try {
        setModelError("");
        const { metadata } = await loadMedicineDetector();

        if (!ignore) {
          setModelMeta(metadata);
          setModelReady(true);
          setDetectorUnavailable(false);
        }
      } catch (error) {
        if (!ignore) {
          setModelError(error?.message || "AI model files could not be loaded.");
          setModelReady(false);
          setDetectorUnavailable(true);
        }
      }
    };

    loadModelMeta();

    return () => {
      ignore = true;
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (!previewNeedsDetection || !previewImage || !resultImageRef.current || !modelReady) {
      return undefined;
    }

    const img = resultImageRef.current;
    const handleLoad = () => {
      setPreviewNeedsDetection(false);
      runDetection(img);
    };

    if (img.complete) {
      handleLoad();
      return undefined;
    }

    img.addEventListener("load", handleLoad);
    return () => img.removeEventListener("load", handleLoad);
  }, [modelReady, previewImage, previewNeedsDetection]);

  const labels = Array.isArray(modelMeta?.labels) ? modelMeta.labels : [];
  const topPredictions = detectionResult?.predictions?.slice(0, 3) || [];
  const bestPrediction = detectionResult?.bestPrediction || null;
  const matchedProductId = Number(bestPrediction?.product?.id);

  useEffect(() => {
    if (!Number.isInteger(matchedProductId) || matchedProductId <= 0) {
      setDatabaseProduct(null);
      setDatabaseProductError("");
      return;
    }

    const controller = new AbortController();

    const loadMatchedProduct = async () => {
      setDatabaseProductError("");

      try {
        const payload = await requestJson(`/api/products/${matchedProductId}`, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setDatabaseProduct(mapApiProduct(payload?.data?.product || {}));
      } catch (error) {
        if (error?.name === "AbortError" || controller.signal.aborted) return;
        const isNotFound = String(error?.message || "").includes("status 404");

        if (isNotFound && bestPrediction?.product) {
          try {
            const syncedProduct = await syncDetectedProductToDatabase(bestPrediction.product);
            if (controller.signal.aborted) return;
            setDatabaseProduct(syncedProduct);
            setDatabaseProductError("");
            return;
          } catch (syncError) {
            if (controller.signal.aborted) return;
            setDatabaseProduct(null);
            setDatabaseProductError(
              syncError?.message || "The detected medicine could not be added to the database.",
            );
            return;
          }
        }

        setDatabaseProduct(null);
        setDatabaseProductError(
          isNotFound
            ? "This medicine was identified, but its live database record is not available yet."
            : error?.message || "Could not load medicine details from the database.",
        );
      }
    };

    loadMatchedProduct();

    return () => {
      controller.abort();
    };
  }, [bestPrediction?.product, matchedProductId]);

  const formatDatabaseDate = (value) => {
    if (!value) return "Not available";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString();
  };

  const getStockTone = (stockValue) => {
    if (stockValue === null) {
      return {
        label: "Stock unknown",
        className: "bg-slate-100 text-slate-700",
      };
    }

    if (stockValue <= 0) {
      return {
        label: "Out of stock",
        className: "bg-rose-100 text-rose-700",
      };
    }

    if (stockValue <= 5) {
      return {
        label: "Low stock",
        className: "bg-amber-100 text-amber-700",
      };
    }

    return {
      label: "In stock",
      className: "bg-emerald-100 text-emerald-700",
    };
  };

  const matchedProduct = databaseProduct || bestPrediction?.product || null;
  const matchedProductStock =
    matchedProduct
      ? (
          getDatabaseStock?.(matchedProduct.id) ??
          matchedProduct.stock ??
          null
        )
      : null;
  const matchedProductDetails = matchedProduct
    ? getProductUsageDetails(matchedProduct, matchedProductStock)
    : null;
  const detectedMedicineDetails =
    !matchedProduct && bestPrediction
      ? getDetectedMedicineDetails(bestPrediction.label)
      : null;
  const stockTone = getStockTone(matchedProductStock);
  const fallbackMedicineType = bestPrediction?.product?.categoryLabel ||
    bestPrediction?.product?.category ||
    "Detected medicine";

  useEffect(() => {
    if (!detectionResultRef.current) return;
    if (!bestPrediction && !detectionError) return;

    detectionResultRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [bestPrediction, detectionError]);

  return (
    <section className="bg-[linear-gradient(180deg,#eef7ff_0%,#ffffff_38%,#f3f8f4_100%)] pt-28 pb-16">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
          <div className="overflow-hidden rounded-[32px] border border-sky-100 bg-white shadow-[0_25px_80px_rgba(15,118,110,0.12)]">
            <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_40%),linear-gradient(135deg,#0f172a,#0f766e)] px-7 py-8 text-white">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.28em]">
                  Detect Medicine
                </span>
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-100">
                  AI image detection connected
                </span>
              </div>
              <h1 className="mt-5 max-w-2xl text-4xl font-black tracking-tight md:text-5xl">
                Scan medicine packs with camera or image upload
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-sky-50/90 md:text-base">
                Capture or upload a medicine photo and this page will run your local AI model,
                rank the predictions, and map the top result to a product in the storefront.
              </p>
            </div>

            <div className="p-6 md:p-7">
              <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`aspect-[16/10] w-full object-cover ${cameraActive ? "block" : "hidden"}`}
                />

                {!cameraActive ? (
                  <div className="flex aspect-[16/10] flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_30%),linear-gradient(160deg,#0f172a,#111827)] px-6 text-center text-white">
                    <div className="rounded-full border border-white/15 bg-white/10 p-4">
                      <Camera className="h-10 w-10 text-sky-200" />
                    </div>
                    <h2 className="mt-5 text-2xl font-black">Camera preview</h2>
                    <p className="mt-3 max-w-md text-sm leading-6 text-slate-200">
                      Start the camera and place a medicine box, strip, or bottle in
                      the frame. You can also upload a medicine image, then run the
                      same detection result flow from the preview.
                    </p>
                  </div>
                ) : null}

                <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8">
                  <div className="relative h-full max-h-[260px] w-full max-w-[260px] rounded-[32px] border-2 border-sky-400/55">
                    <div className="absolute left-4 right-4 top-1/2 h-[2px] -translate-y-1/2 bg-sky-300 shadow-[0_0_18px_rgba(125,211,252,0.95)]" />
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={cameraActive ? stopCamera : startCamera}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition ${
                    cameraActive
                      ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                      : "bg-sky-600 text-white hover:bg-sky-700"
                  }`}
                >
                  <Camera className="h-4 w-4" />
                  {cameraActive ? "Stop Camera" : "Start Camera"}
                </button>

<button
  type="button"
  onClick={async () => {
    if (cameraActive) {
      // Direct path: Camera is already on
      captureFrame();
    } else {
      // Sequence path: Power on -> Wait for stream -> Capture
      const success = await activateCamera();
      if (success) {
        // Small delay to ensure the video frame isn't black
        setTimeout(() => {
          captureFrame();
        }, 10000); 
      }
    }
  }}
  disabled={(!cameraActive && !previewImage) || !modelReady || isDetecting}
  className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
>
  <ScanSearch className="h-4 w-4" />
  {cameraActive ? "Capture + Detect" : "Detect Again"}
</button>

                <button
                  type="button"
                  onClick={openFilePicker}
                  disabled={!modelReady || isDetecting}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  Upload Photo
                </button>

                <button
                  type="button"
                  onClick={clearPreview}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Clear Preview
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <canvas ref={canvasRef} className="hidden" />

              {cameraError ? (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{cameraError}</p>
                </div>
              ) : null}

              <div className="mt-7 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.24em] text-slate-500">
                    <Pill className="h-4 w-4 text-sky-600" />
                    Preview Image
                  </div>
                  <div className="mt-4 overflow-hidden rounded-[22px] border border-dashed border-slate-300 bg-white">
                    {previewImage ? (
                      <img
                        ref={resultImageRef}
                        src={previewImage}
                        alt="Medicine preview"
                        className="aspect-square w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-square items-center justify-center px-6 text-center text-sm leading-6 text-slate-500">
                        The uploaded or captured medicine image will appear here.
                      </div>
                    )}
                  </div>
                  {previewImage ? (
                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      {previewSource === "upload"
                        ? "Uploaded image is being checked by AI. The medicine result will appear on the right."
                        : previewSource === "camera"
                          ? "Captured image is being checked by AI. The medicine result will appear on the right."
                          : "Preview image is ready for detection."}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-[26px] border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.24em] text-slate-500">
                    <Cpu className="h-4 w-4 text-emerald-600" />
                    AI Status
                  </div>

                  <div className="mt-4 space-y-4">
                    <div className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                      <div>
                        <p className="text-sm font-bold text-slate-800">Model assets</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {modelReady
                            ? "The medicine image detector is loaded and ready to run locally in the frontend."
                            : detectorUnavailable
                              ? "The medicine detector is currently unavailable in this browser session."
                              : "The page is waiting for the AI detector to finish loading."}
                        </p>
                      </div>
                      {modelReady ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                      ) : (
                        <LoaderCircle className="h-5 w-5 shrink-0 animate-spin text-sky-600" />
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <StatusCard label="Model Name" value={modelMeta?.modelName || "tm-my-image-model"} />
                      <StatusCard label="Image Size" value={modelMeta?.imageSize ? `${modelMeta.imageSize}px` : "224px"} />
                      <StatusCard label="TFJS" value={modelMeta?.tfjsVersion || (detectorUnavailable ? "Unavailable" : "Not loaded")} />
                      <StatusCard label="Labels" value={labels.length ? `${labels.length} classes` : "No labels found"} />
                    </div>

                    {isDetecting ? (
                      <p className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                        Running AI detection on the selected image...
                      </p>
                    ) : null}

                    {modelError ? (
                      <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        {modelError}
                      </p>
                    ) : null}

                    {detectorUnavailable ? (
                      <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        The rest of the storefront will keep working normally. The AI
                        scanner needs TensorFlow.js available in the browser before image
                        detection can run.
                      </p>
                    ) : null}

                    {detectionError ? (
                      <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        {detectionError}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[30px] border border-emerald-100 bg-[linear-gradient(135deg,#ecfeff,#f0fdf4)] p-6 shadow-[0_18px_50px_rgba(22,163,74,0.09)]">
              <div className="inline-flex rounded-full bg-emerald-100 p-3 text-emerald-700">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-2xl font-black text-slate-900">
                Detection flow connected
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                The AI now runs directly in the frontend using your local model files,
                then links the top prediction back to the medicine catalog.
              </p>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-black text-slate-900">How users will use it</h3>
              <div className="mt-4 space-y-4">
                <StepItem index="01" text="Open the camera or upload a clear photo of the medicine pack." />
                <StepItem index="02" text="Capture with the camera or upload an image and let AI detect the medicine automatically." />
                <StepItem index="03" text="Review the detection result with medicine name, type, stock, expiry date, and usage details." />
              </div>
            </div>

            <div ref={detectionResultRef} className="rounded-[30px] border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.24em] text-slate-500">
                <Sparkles className="h-4 w-4 text-sky-600" />
                Detection Result
              </div>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Your medicine result appears here after AI image detection runs.
              </p>

              {bestPrediction ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">
                      Top Prediction
                    </p>
                    <p className="mt-2 text-xl font-black text-slate-900">
                      {bestPrediction.label}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Confidence: {bestPrediction.percentage.toFixed(1)}%
                    </p>
                  </div>

                  {matchedProduct ? (
                    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
                      <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#f8fbff,#eefaf5)] p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                            Matched Medicine
                          </p>
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${stockTone.className}`}>
                            {stockTone.label}
                          </span>
                        </div>

                        <div className="mt-4 flex gap-4">
                          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                            <img
                              src={matchedProduct.image}
                              alt={matchedProduct.name}
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xl font-black text-slate-900">
                              {matchedProduct.name}
                            </h4>
                            <p className="mt-1 text-sm text-slate-500">
                              {matchedProduct.categoryLabel || matchedProduct.category || "General medicine"}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <InfoPill label="Type" value={matchedProduct.categoryLabel || matchedProduct.category || "General"} />
                              <InfoPill label="Price" value={`${Number(matchedProduct.price || 0).toLocaleString()} MMK`} />
                              <InfoPill label="Stock" value={matchedProductStock === null ? "Not available" : `${matchedProductStock}`} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 p-5">
                        {/* <div className="grid gap-3 md:grid-cols-4">
                          <HighlightCard
                            title="Medicine Name"
                            value={matchedProduct.name}
                            accent="sky"
                          />
                          <HighlightCard
                            title="Type"
                            value={matchedProduct.categoryLabel || matchedProduct.category || "General"}
                            accent="sky"
                          />
                          <HighlightCard
                            title="Exp Date"
                            value={formatDatabaseDate(matchedProduct.expiryDate)}
                            accent="emerald"
                          />
                          <HighlightCard
                            title="Stock"
                            value={matchedProductStock === null ? "Not available" : `${matchedProductStock} available`}
                            accent="amber"
                          />
                        </div> */}

                        <div className="rounded-2xl border border-sky-100 bg-[linear-gradient(180deg,#f2f9ff,#ffffff)] p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-700">
                            About This Medicine
                          </p>
                          <p className="mt-3 text-sm leading-7 text-slate-700">
                            {matchedProduct.description || "No medicine summary is available yet."}
                          </p>
                        </div>

                        {matchedProductDetails ? (
                          <div className="grid gap-3 md:grid-cols-2">
                            <DetailCard title="Usage" value={matchedProductDetails.usage} />
                            <DetailCard title="How To Use" value={matchedProductDetails.howToUse} />
                            <DetailCard title="When To Use" value={matchedProductDetails.whenToUse} />
                            <DetailCard title="Frequency" value={matchedProductDetails.frequency} />
                            <DetailCard title="Caution" value={matchedProductDetails.caution} />
                            <DetailCard title="Storage" value={matchedProductDetails.storage} />
                          </div>
                        ) : null}

                        <div className="grid gap-3 md:grid-cols-2">
                          <MetaCard label="Medicine Name" value={matchedProduct.name} />
                          <MetaCard label="Type" value={matchedProduct.categoryLabel || matchedProduct.category || "General"} />
                          <MetaCard label="Price" value={`${Number(matchedProduct.price || 0).toLocaleString()} MMK`} />
                          <MetaCard label="Stock" value={matchedProductStock === null ? "Not available" : matchedProductStock} />
                          <MetaCard label="Exp Date" value={formatDatabaseDate(matchedProduct.expiryDate)} />
                          <MetaCard label="Date Added" value={formatDatabaseDate(matchedProduct.createdAt)} />
                          <div className="md:col-span-2">
                            <MetaCard label="Last Updated" value={formatDatabaseDate(matchedProduct.updatedAt)} />
                          </div>
                        </div>

                        {matchedProductDetails ? (
                          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-900">
                            <span className="font-bold">Stock note:</span> {matchedProductDetails.stockText}
                          </div>
                        ) : null}

                        {databaseProductError ? (
                          <p className="text-sm text-amber-700">
                            {databaseProductError}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                        The AI found a medicine label, but it could not be mapped to an existing storefront product yet.
                      </div>

                      {detectedMedicineDetails ? (
                        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
                          <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#fff9eb,#fff4f0)] p-5">
                            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                              Detected Medicine Info
                            </p>
                            <h4 className="mt-3 text-xl font-black text-slate-900">
                              {detectedMedicineDetails.name}
                            </h4>
                            <p className="mt-2 text-sm text-slate-600">
                              This information is based on the detected medicine label even though
                              there is no linked storefront product yet.
                            </p>
                          </div>

                          <div className="space-y-4 p-5">
                            <div className="grid gap-3 md:grid-cols-4">
                              <HighlightCard
                                title="Medicine Name"
                                value={detectedMedicineDetails.name}
                                accent="sky"
                              />
                              <HighlightCard
                                title="Type"
                                value={fallbackMedicineType}
                                accent="sky"
                              />
                              <HighlightCard
                                title="Exp Date"
                                value="Not available"
                                accent="emerald"
                              />
                              <HighlightCard
                                title="Stock"
                                value="Not available"
                                accent="amber"
                              />
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              <DetailCard title="Usage" value={detectedMedicineDetails.usage} />
                              <DetailCard title="How To Use" value={detectedMedicineDetails.howToUse} />
                              <DetailCard title="When To Use" value={detectedMedicineDetails.whenToUse} />
                              <DetailCard title="Frequency" value={detectedMedicineDetails.frequency} />
                              <DetailCard title="Caution" value={detectedMedicineDetails.caution} />
                              <DetailCard title="Storage" value={detectedMedicineDetails.storage} />
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              <MetaCard label="Medicine Name" value={detectedMedicineDetails.name} />
                              <MetaCard label="Type" value={fallbackMedicineType} />
                              <MetaCard label="Stock" value="Not available" />
                              <MetaCard label="Exp Date" value="Not available" />
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* {topPredictions.length ? (
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                        Top Alternatives
                      </p>
                      <div className="mt-3 space-y-3">
                        {topPredictions.map((prediction) => (
                          <div
                            key={prediction.label}
                            className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-800">
                                {prediction.label}
                              </p>
                              <p className="text-xs text-slate-500">
                                {prediction.product?.name || "No catalog match yet"}
                              </p>
                            </div>
                            <span className="ml-4 rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">
                              {prediction.percentage.toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null} */}
                </div>
              ) : (
                <div className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm leading-6 text-slate-500">
                  Capture or upload a medicine image to see live AI predictions here.
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

const StatusCard = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
      {label}
    </p>
    <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{value}</p>
  </div>
);

const HighlightCard = ({ title, value, accent = "sky" }) => {
  const accentClasses = {
    sky: "border-sky-100 bg-sky-50/70 text-sky-700",
    emerald: "border-emerald-100 bg-emerald-50/70 text-emerald-700",
    amber: "border-amber-100 bg-amber-50/80 text-amber-700",
  };

  return (
    <div className={`rounded-2xl border px-4 py-4 ${accentClasses[accent] || accentClasses.sky}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em]">
        {title}
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">{value}</p>
    </div>
  );
};

const InfoPill = ({ label, value }) => (
  <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
    <span className="text-slate-400">{label}:</span> {value}
  </div>
);

const DetailCard = ({ title, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
      {title}
    </p>
    <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
  </div>
);

const MetaCard = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
      {label}
    </p>
    <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{value}</p>
  </div>
);

const StepItem = ({ index, text }) => (
  <div className="flex items-start gap-3">
    <div className="min-w-11 rounded-2xl bg-sky-100 px-3 py-2 text-center text-xs font-black text-sky-700">
      {index}
    </div>
    <p className="pt-1 text-sm leading-6 text-slate-600">{text}</p>
  </div>
);

export default DetectMedicine;
