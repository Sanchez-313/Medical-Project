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
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "advertisements");

/** Admin-only management of the home-page ad slideshow. Every slide, active or not — the public /api/advertisements route is the active-only, ordered feed the storefront actually renders. */
export async function GET() {
  const gate = await requireRole(ROLE_GROUPS.OWNER_ONLY);
  if (!gate.ok) return gate.response;

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, title, description, title_my, description_my, image_url, link_url, sort_order, is_active, created_at FROM advertisements ORDER BY sort_order ASC, created_at DESC"
  );
  return NextResponse.json({ success: true, data: rows });
}

async function saveUploadedImage(file: File): Promise<string> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) throw new Error("unsupported image type");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("image exceeds 5MB limit");

  const bytes = Buffer.from(await file.arrayBuffer());
  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${randomUUID()}.${EXTENSION_BY_MIME[file.type]}`;
  await writeFile(path.join(UPLOAD_DIR, filename), bytes);
  return `/uploads/advertisements/${filename}`;
}

/** Add a new slide. multipart/form-data so the image uploads in the same request. */
export async function POST(request: Request) {
  const gate = await requireRole(ROLE_GROUPS.OWNER_ONLY);
  if (!gate.ok) return gate.response;

  const formData = await request.formData();
  const title = (formData.get("title") as string | null)?.trim();
  const description = (formData.get("description") as string | null)?.trim() || null;
  const titleMy = (formData.get("title_my") as string | null)?.trim() || null;
  const descriptionMy = (formData.get("description_my") as string | null)?.trim() || null;
  const linkUrl = (formData.get("link_url") as string | null)?.trim() || null;
  const sortOrderRaw = formData.get("sort_order");
  const sortOrder = sortOrderRaw != null && sortOrderRaw !== "" ? Number(sortOrderRaw) : 0;
  const image = formData.get("image");

  if (!title) {
    return NextResponse.json({ success: false, message: "Title is required" }, { status: 400 });
  }
  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json({ success: false, message: "An image is required" }, { status: 400 });
  }

  let imageUrl: string;
  try {
    imageUrl = await saveUploadedImage(image);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Image upload failed" },
      { status: 400 }
    );
  }

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO advertisements (title, description, title_my, description_my, image_url, link_url, sort_order, is_active)
     VALUES (:title, :description, :title_my, :description_my, :image_url, :link_url, :sort_order, 1)`,
    {
      title,
      description,
      title_my: titleMy,
      description_my: descriptionMy,
      image_url: imageUrl,
      link_url: linkUrl,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    }
  );

  return NextResponse.json({ success: true, data: { id: result.insertId } }, { status: 201 });
}
