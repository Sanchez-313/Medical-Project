import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import { canTransition } from "@/lib/orderStatus";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

/**
 * Combines both transaction sources into one owner-facing list:
 *   - `sales`  = in-store POS/checkout, run by a staff/agent (source: "POS")
 *   - `orders` = customer self-checkout from the storefront (source: "Storefront")
 * These are separate tables (see config/azuremed_schema.sql), so this route
 * unions them rather than only showing one — a customer's real checkout was
 * previously invisible here because only `sales` was queried.
 */
export async function GET() {
  const gate = await requireRole(ROLE_GROUPS.OWNER_ONLY);
  if (!gate.ok) return gate.response;

  // shipping_phone/city/address: NULL for POS rows (in-store, nothing to
  // ship) — only Storefront rows carry real values. Added for
  // /admin/deliveries, which needs the delivery address; kept on this same
  // shared query rather than a separate endpoint so both pages stay backed
  // by one source of truth for order data.
  const [rows] = await pool.query<RowDataPacket[]>(
    `(SELECT s.id, s.sale_code AS code, 'POS' AS source, s.customer_name, s.payment_method,
             s.total_ks, s.status, s.created_at, u.name AS handled_by,
             NULL AS payment_proof_url, 'not_required' AS payment_status, NULL AS telegram_username,
             NULL AS shipping_phone, NULL AS shipping_city, NULL AS shipping_address
      FROM sales s
      JOIN users u ON u.id = s.handled_by_user_id)
     UNION ALL
     (SELECT o.id, o.order_code AS code, IF(o.telegram_chat_id IS NOT NULL, 'Telegram', 'Storefront') AS source,
             o.shipping_name AS customer_name, o.payment_method,
             o.total_ks, o.status, o.created_at, NULL AS handled_by,
             o.payment_proof_url, o.payment_status, o.telegram_username,
             o.shipping_phone, o.shipping_city, o.shipping_address
      FROM orders o)
     ORDER BY created_at DESC
     LIMIT 100`
  );

  return NextResponse.json({ success: true, data: rows });
}

/**
 * Two actions in one endpoint (mirrors /api/staff/orders — Owner has the
 * same fulfillment capabilities as Staff, plus the full POS+Storefront
 * ledger above):
 *   - { order_id, decision } — review a KBZ Pay payment screenshot.
 *   - { order_id, status }   — advance the fulfillment pipeline.
 */
export async function PATCH(request: Request) {
  const gate = await requireRole(ROLE_GROUPS.OWNER_ONLY);
  if (!gate.ok) return gate.response;

  const body = (await request.json()) as { order_id?: number; decision?: "confirmed" | "rejected"; status?: string };
  const { order_id, decision, status } = body;

  if (!order_id) {
    return NextResponse.json({ success: false, message: "order_id is required" }, { status: 400 });
  }

  if (decision) {
    if (decision !== "confirmed" && decision !== "rejected") {
      return NextResponse.json({ success: false, message: "Invalid decision" }, { status: 400 });
    }
    const orderStatus = decision === "confirmed" ? "confirmed" : "cancelled";
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE orders SET payment_status = :decision, status = :order_status
       WHERE id = :order_id AND payment_status = 'pending_review'`,
      { decision, order_status: orderStatus, order_id }
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: "Order not found or already reviewed" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  }

  if (status) {
    const [[order]] = await pool.query<RowDataPacket[]>("SELECT status FROM orders WHERE id = :order_id", { order_id });
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }
    if (!canTransition(order.status, status)) {
      return NextResponse.json(
        { success: false, message: `Cannot move an order from ${order.status} to ${status}` },
        { status: 400 }
      );
    }
    await pool.query("UPDATE orders SET status = :status WHERE id = :order_id", { status, order_id });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, message: "decision or status is required" }, { status: 400 });
}
