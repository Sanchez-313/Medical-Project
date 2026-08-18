import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";

const MODEL_DIR = path.join(process.cwd(), "ai");

// Whitelisted exactly, not just pattern-matched — this reads straight off
// disk by filename, so an unvalidated path segment would be a traversal
// vector (../../.env etc).
const CONTENT_TYPE_BY_FILE: Record<string, string> = {
  "model.json": "application/json",
  "weights.bin": "application/octet-stream",
  "metadata.json": "application/json",
};

/**
 * Serves the same ai/ model files lib/teachableMachine.ts reads server-side,
 * so the browser can run live/continuous inference (detect-medicine's
 * auto-capture scan loop) without a network round-trip per frame. This is
 * deliberately the ONLY thing client-side inference is used for — deciding
 * *when* to auto-capture — the actual result still always comes from
 * POSTing the captured frame to /api/ai/detect, which re-runs the canonical
 * server-side model and does the real catalog match. Single source of truth
 * (this ai/ directory) for both, so a future model swap (see the earlier
 * "update ai model" work) updates both paths automatically with zero extra
 * steps.
 */
export async function GET(_request: Request, { params }: { params: { file: string } }) {
  const gate = await requireRole(ROLE_GROUPS.ANY_AUTHENTICATED);
  if (!gate.ok) return gate.response;

  const contentType = CONTENT_TYPE_BY_FILE[params.file];
  if (!contentType) {
    return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
  }

  try {
    const data = await readFile(path.join(MODEL_DIR, params.file));
    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        // The model only changes when someone deliberately swaps these
        // files (see scripts — there's no versioned filename), so caching
        // is opt-out via a hard reload, not opt-in via a query string.
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
  }
}
