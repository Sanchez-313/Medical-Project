import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import { mapLabelToProduct } from "@/lib/productLabelMatch";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "detections");

interface GoogleAiPrediction {
  displayNames?: string[];
  confidences?: number[];
}

/**
 * Receives an image upload from the storefront/dashboard, forwards it to the
 * Google AI (Vertex AI / AutoML Vision) prediction endpoint using
 * server-only credentials, then maps the returned label to a catalog product
 * server-side. The API key/endpoint never reach the client bundle.
 */
export async function POST(request: Request) {
  const gate = await requireRole(ROLE_GROUPS.OPERATIONAL);
  if (!gate.ok) return gate.response;

  const endpoint = process.env.GOOGLE_AI_ENDPOINT;
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!endpoint || !apiKey) {
    return NextResponse.json(
      { success: false, message: "AI detection is not configured on the server" },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, message: "image file is required" }, { status: 400 });
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ success: false, message: "unsupported image type" }, { status: 415 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ success: false, message: "image exceeds 5MB limit" }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const base64Image = bytes.toString("base64");

  // Persist the upload before calling out to Google so every detection
  // attempt has a durable image_url for the log, even if the AI call fails.
  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${randomUUID()}.${EXTENSION_BY_MIME[file.type]}`;
  await writeFile(path.join(UPLOAD_DIR, filename), bytes);
  const imageUrl = `/uploads/detections/${filename}`;

  const googleResponse = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      instances: [{ content: base64Image }],
      parameters: { confidenceThreshold: 0.5, maxPredictions: 5 },
    }),
  });

  if (!googleResponse.ok) {
    await logDetection({ userId: Number(gate.session.user.id), imageUrl, label: null, confidence: null, matchedMedicineId: null });
    return NextResponse.json(
      { success: false, message: "AI provider request failed" },
      { status: 502 }
    );
  }

  const prediction = (await googleResponse.json()) as { predictions?: GoogleAiPrediction[] };
  const first = prediction.predictions?.[0];
  const label = first?.displayNames?.[0] ?? null;
  const confidence = first?.confidences?.[0] ?? null;

  if (!label) {
    await logDetection({ userId: Number(gate.session.user.id), imageUrl, label: null, confidence, matchedMedicineId: null });
    return NextResponse.json({ success: true, data: { label: null, confidence: 0, matchedProduct: null } });
  }

  const [catalog] = await pool.query<RowDataPacket[]>(
    "SELECT id, name, stock_qty AS stock FROM medicines WHERE is_active = 1"
  );
  const matchedProduct = mapLabelToProduct(
    label,
    catalog as Array<{ id: number; name: string; stock: number }>
  );

  await logDetection({
    userId: Number(gate.session.user.id),
    imageUrl,
    label,
    confidence,
    matchedMedicineId: matchedProduct?.id ?? null,
  });

  return NextResponse.json({
    success: true,
    data: {
      label,
      confidence,
      matchedProduct: matchedProduct
        ? { id: matchedProduct.id, name: matchedProduct.name, stock: matchedProduct.stock }
        : null,
    },
  });
}

async function logDetection(entry: {
  userId: number;
  imageUrl: string;
  label: string | null;
  confidence: number | null;
  matchedMedicineId: number | null;
}) {
  await pool.query<ResultSetHeader>(
    `INSERT INTO ai_detection_logs (user_id, image_url, detected_label, confidence, matched_medicine_id)
     VALUES (:user_id, :image_url, :detected_label, :confidence, :matched_medicine_id)`,
    {
      user_id: entry.userId,
      image_url: entry.imageUrl,
      detected_label: entry.label,
      confidence: entry.confidence,
      matched_medicine_id: entry.matchedMedicineId,
    }
  );
}
