import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import type { RowDataPacket } from "mysql2";

/**
 * Unified activity feed assembled from real tables — no separate audit-log
 * table exists yet, so this unions the events that already carry a
 * timestamp and an actor: new registrations, storefront checkouts, POS
 * sales, and AI detections.
 */
export async function GET() {
  const gate = await requireRole(ROLE_GROUPS.OWNER_ONLY);
  if (!gate.ok) return gate.response;

  const [rows] = await pool.query<RowDataPacket[]>(
    `(SELECT 'registration' AS type, CONCAT(name, ' registered an account') AS description,
             name AS actor, created_at
      FROM users)
     UNION ALL
     (SELECT 'order' AS type, CONCAT(shipping_name, ' placed order ', order_code, ' (', total_ks, ' MMK)') AS description,
             shipping_name AS actor, created_at
      FROM orders)
     UNION ALL
     (SELECT 'sale' AS type, CONCAT(u.name, ' processed POS sale ', s.sale_code, ' (', s.total_ks, ' MMK)') AS description,
             u.name AS actor, s.created_at
      FROM sales s JOIN users u ON u.id = s.handled_by_user_id)
     UNION ALL
     (SELECT 'detection' AS type,
             CONCAT(u.name, ' ran an AI detection', IF(d.detected_label IS NOT NULL, CONCAT(' (', d.detected_label, ')'), '')) AS description,
             u.name AS actor, d.created_at
      FROM ai_detection_logs d JOIN users u ON u.id = d.user_id)
     ORDER BY created_at DESC
     LIMIT 50`
  );

  return NextResponse.json({ success: true, data: rows });
}
