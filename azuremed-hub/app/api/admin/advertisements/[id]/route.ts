import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import type { ResultSetHeader } from "mysql2";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const EXTENSION_BY_MIME: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "advertisements");

async function saveUploadedImage(file: File): Promise<string> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) throw new Error("unsupported image type");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("image exceeds 5MB limit");

  const bytes = Buffer.from(await file.arrayBuffer());
  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${randomUUID()}.${EXTENSION_BY_MIME[file.type]}`;
  await writeFile(path.join(UPLOAD_DIR, filename), bytes);
  return `/uploads/advertisements/${filename}`;
}

/** Edit a slide: title, link, sort order, active toggle, and/or a replacement image. Accepts either JSON (no image change) or multipart/form-data (uploading a new image). */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const gate = await requireRole(ROLE_GROUPS.OWNER_ONLY);
  if (!gate.ok) return gate.response;

  const id = Number(params.id);
  const contentType = request.headers.get("content-type") ?? "";

  const sets: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mysql2's
  // QueryValues overloads don't accept Record<string, unknown>; this bag is
  // genuinely heterogeneous going straight into named placeholders.
  const params_: Record<string, any> = { id };

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    if (formData.has("title")) {
      sets.push("title = :title");
      params_.title = (formData.get("title") as string).trim();
    }
    if (formData.has("description")) {
      sets.push("description = :description");
      params_.description = (formData.get("description") as string)?.trim() || null;
    }
    if (formData.has("title_my")) {
      sets.push("title_my = :title_my");
      params_.title_my = (formData.get("title_my") as string)?.trim() || null;
    }
    if (formData.has("description_my")) {
      sets.push("description_my = :description_my");
      params_.description_my = (formData.get("description_my") as string)?.trim() || null;
    }
    if (formData.has("link_url")) {
      sets.push("link_url = :link_url");
      params_.link_url = (formData.get("link_url") as string)?.trim() || null;
    }
    if (formData.has("sort_order")) {
      sets.push("sort_order = :sort_order");
      params_.sort_order = Number(formData.get("sort_order")) || 0;
    }
    if (formData.has("is_active")) {
      sets.push("is_active = :is_active");
      params_.is_active = formData.get("is_active") === "true" ? 1 : 0;
    }
    const image = formData.get("image");
    if (image instanceof File && image.size > 0) {
      try {
        params_.image_url = await saveUploadedImage(image);
        sets.push("image_url = :image_url");
      } catch (error) {
        return NextResponse.json(
          { success: false, message: error instanceof Error ? error.message : "Image upload failed" },
          { status: 400 }
        );
      }
    }
  } else {
    const body = (await request.json()) as {
      title?: string;
      description?: string | null;
      title_my?: string | null;
      description_my?: string | null;
      link_url?: string | null;
      sort_order?: number;
      is_active?: boolean;
    };
    if (body.title !== undefined) {
      sets.push("title = :title");
      params_.title = body.title.trim();
    }
    if (body.description !== undefined) {
      sets.push("description = :description");
      params_.description = body.description?.trim() || null;
    }
    if (body.title_my !== undefined) {
      sets.push("title_my = :title_my");
      params_.title_my = body.title_my?.trim() || null;
    }
    if (body.description_my !== undefined) {
      sets.push("description_my = :description_my");
      params_.description_my = body.description_my?.trim() || null;
    }
    if (body.link_url !== undefined) {
      sets.push("link_url = :link_url");
      params_.link_url = body.link_url?.trim() || null;
    }
    if (body.sort_order !== undefined) {
      sets.push("sort_order = :sort_order");
      params_.sort_order = body.sort_order;
    }
    if (body.is_active !== undefined) {
      sets.push("is_active = :is_active");
      params_.is_active = body.is_active ? 1 : 0;
    }
  }

  if (!sets.length) {
    return NextResponse.json({ success: false, message: "No fields to update" }, { status: 400 });
  }

  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE advertisements SET ${sets.join(", ")} WHERE id = :id`,
    params_
  );
  if (result.affectedRows === 0) {
    return NextResponse.json({ success: false, message: "Slide not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const gate = await requireRole(ROLE_GROUPS.OWNER_ONLY);
  if (!gate.ok) return gate.response;

  const [result] = await pool.query<ResultSetHeader>("DELETE FROM advertisements WHERE id = :id", {
    id: Number(params.id),
  });
  if (result.affectedRows === 0) {
    return NextResponse.json({ success: false, message: "Slide not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
