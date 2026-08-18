import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const EXTENSION_BY_MIME: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "medicines");

/**
 * Owner-only full medicine CRUD ("Manage Products") — the only place
 * cost_price_ks is ever read or written. Staff get a separate, cost-free
 * view+inventory-only endpoint at /api/staff/medicines instead of a
 * role-conditional select here, so it's obvious at a glance which fields
 * each audience can ever touch.
 */
export async function GET(request: Request) {
  const gate = await requireRole(ROLE_GROUPS.OWNER_ONLY);
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();
  const category = searchParams.get("category")?.trim();

  // Deactivated rows (is_active = 0 — e.g. the old placeholder catalog) stay
  // out of the default Inventory view; without this, dropping a category
  // never actually removes its tab here since the tab list is built from
  // whatever categories come back from this query.
  const conditions: string[] = ["is_active = 1"];
  const params: Record<string, string> = {};
  if (search) {
    conditions.push("name LIKE :search");
    params.search = `%${search}%`;
  }
  if (category) {
    conditions.push("category = :category");
    params.category = category;
  }
  const where = `WHERE ${conditions.join(" AND ")}`;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, sku, category, description, image_url, selling_price_ks, cost_price_ks,
            stock_qty, reorder_level, expiry_date, status
     FROM medicines ${where} ORDER BY name ASC`,
    params
  );

  return NextResponse.json({ success: true, data: rows });
}

function computeStatus(stockQty: number, reorderLevel: number, expiryDate: string | null): "normal" | "low" | "expired" {
  if (expiryDate && new Date(expiryDate) < new Date()) return "expired";
  return stockQty <= reorderLevel ? "low" : "normal";
}

async function saveUploadedImage(file: File): Promise<string> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) throw new Error("unsupported image type");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("image exceeds 5MB limit");

  const bytes = Buffer.from(await file.arrayBuffer());
  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${randomUUID()}.${EXTENSION_BY_MIME[file.type]}`;
  await writeFile(path.join(UPLOAD_DIR, filename), bytes);
  return `/uploads/medicines/${filename}`;
}

/** Add a new product. multipart/form-data so an image can be uploaded in the same request. */
export async function POST(request: Request) {
  const gate = await requireRole(ROLE_GROUPS.OWNER_ONLY);
  if (!gate.ok) return gate.response;

  const formData = await request.formData();
  const name = (formData.get("name") as string | null)?.trim();
  const category = (formData.get("category") as string | null)?.trim();
  const description = (formData.get("description") as string | null)?.trim() || null;
  const sellingPriceKs = Number(formData.get("selling_price_ks"));
  const costPriceKsRaw = formData.get("cost_price_ks") as string | null;
  const costPriceKs = costPriceKsRaw ? Number(costPriceKsRaw) : null;
  const stockQty = Number(formData.get("stock_qty") ?? 0);
  const expiryDate = (formData.get("expiry_date") as string | null) || null;
  let reorderLevel = Number(formData.get("reorder_level"));
  const skuInput = (formData.get("sku") as string | null)?.trim();
  const image = formData.get("image");

  if (!name || !category || !Number.isFinite(sellingPriceKs) || sellingPriceKs <= 0) {
    return NextResponse.json(
      { success: false, message: "name, category, and a valid selling price are required" },
      { status: 400 }
    );
  }

  if (!Number.isFinite(reorderLevel) || reorderLevel < 0) {
    const [[settings]] = await pool.query<RowDataPacket[]>(
      "SELECT low_stock_default_threshold FROM store_settings WHERE id = 1"
    );
    reorderLevel = settings?.low_stock_default_threshold ?? 20;
  }

  let imageUrl: string | null = null;
  if (image instanceof File && image.size > 0) {
    try {
      imageUrl = await saveUploadedImage(image);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: error instanceof Error ? error.message : "Image upload failed" },
        { status: 400 }
      );
    }
  }

  const sku = skuInput || `MED-${Date.now()}`;
  const status = computeStatus(stockQty, reorderLevel, expiryDate);

  try {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO medicines (name, sku, category, description, image_url, selling_price_ks, cost_price_ks, stock_qty, reorder_level, expiry_date, status, is_active)
       VALUES (:name, :sku, :category, :description, :image_url, :selling_price_ks, :cost_price_ks, :stock_qty, :reorder_level, :expiry_date, :status, 1)`,
      {
        name,
        sku,
        category,
        description,
        image_url: imageUrl,
        selling_price_ks: sellingPriceKs,
        cost_price_ks: costPriceKs,
        stock_qty: Number.isFinite(stockQty) ? stockQty : 0,
        reorder_level: reorderLevel,
        expiry_date: expiryDate,
        status,
      }
    );
    return NextResponse.json({ success: true, data: { id: result.insertId } }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("Duplicate") ? "That SKU is already in use" : "Could not create product";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

/** Edit an existing product — every field, including cost_price_ks. */
export async function PATCH(request: Request) {
  const gate = await requireRole(ROLE_GROUPS.OWNER_ONLY);
  if (!gate.ok) return gate.response;

  const formData = await request.formData();
  const id = Number(formData.get("id"));
  if (!id) {
    return NextResponse.json({ success: false, message: "id is required" }, { status: 400 });
  }

  const [[existing]] = await pool.query<RowDataPacket[]>(
    "SELECT stock_qty, reorder_level, expiry_date FROM medicines WHERE id = :id",
    { id }
  );
  if (!existing) {
    return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
  }

  const sets: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mysql2's
  // QueryValues overloads don't accept Record<string, unknown>; this bag is
  // genuinely heterogeneous (string/number/null) going straight into named
  // placeholders, so `any` here reflects the real shape, not a hidden bug.
  const params: Record<string, any> = { id };

  const name = (formData.get("name") as string | null)?.trim();
  if (name) { sets.push("name = :name"); params.name = name; }

  const category = (formData.get("category") as string | null)?.trim();
  if (category) { sets.push("category = :category"); params.category = category; }

  if (formData.has("description")) {
    sets.push("description = :description");
    params.description = (formData.get("description") as string | null)?.trim() || null;
  }

  const sellingPriceKs = Number(formData.get("selling_price_ks"));
  if (formData.has("selling_price_ks") && Number.isFinite(sellingPriceKs) && sellingPriceKs > 0) {
    sets.push("selling_price_ks = :selling_price_ks");
    params.selling_price_ks = sellingPriceKs;
  }

  if (formData.has("cost_price_ks")) {
    const costPriceKsRaw = formData.get("cost_price_ks") as string;
    const costPriceKs = costPriceKsRaw ? Number(costPriceKsRaw) : null;
    sets.push("cost_price_ks = :cost_price_ks");
    params.cost_price_ks = costPriceKs;
  }

  const stockQty = formData.has("stock_qty") ? Number(formData.get("stock_qty")) : existing.stock_qty;
  if (formData.has("stock_qty") && Number.isFinite(stockQty)) {
    sets.push("stock_qty = :stock_qty");
    params.stock_qty = stockQty;
  }

  const reorderLevel = formData.has("reorder_level") ? Number(formData.get("reorder_level")) : existing.reorder_level;
  if (formData.has("reorder_level") && Number.isFinite(reorderLevel)) {
    sets.push("reorder_level = :reorder_level");
    params.reorder_level = reorderLevel;
  }

  const expiryDate = formData.has("expiry_date") ? (formData.get("expiry_date") as string) || null : existing.expiry_date;
  if (formData.has("expiry_date")) {
    sets.push("expiry_date = :expiry_date");
    params.expiry_date = expiryDate;
  }

  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    try {
      params.image_url = await saveUploadedImage(image);
      sets.push("image_url = :image_url");
    } catch (error) {
      return NextResponse.json(
        { success: false, message: error instanceof Error ? error.message : "Image upload failed" },
        { status: 400 }
      );
    }
  }

  // Deactivate / reactivate ("Delete"/"Restore" in the Inventory UI). A hard
  // DELETE isn't safe here — sale_items/order_items/product_reviews/etc all
  // reference medicines(id) without ON DELETE CASCADE, so removing a row
  // that's ever been sold would fail on the FK constraint. is_active is the
  // same soft-delete convention scripts/seed.js already uses for the old
  // placeholder catalog; GET above already filters to is_active = 1, so a
  // deactivated product just stops appearing without touching any history.
  if (formData.has("is_active")) {
    sets.push("is_active = :is_active");
    params.is_active = formData.get("is_active") === "true" ? 1 : 0;
  }

  const status = computeStatus(
    Number.isFinite(stockQty) ? stockQty : existing.stock_qty,
    Number.isFinite(reorderLevel) ? reorderLevel : existing.reorder_level,
    expiryDate
  );
  sets.push("status = :status");
  params.status = status;

  if (!sets.length) {
    return NextResponse.json({ success: false, message: "No fields to update" }, { status: 400 });
  }

  await pool.query(`UPDATE medicines SET ${sets.join(", ")} WHERE id = :id`, params);

  return NextResponse.json({ success: true });
}
