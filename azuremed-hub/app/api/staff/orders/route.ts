import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import { canTransition } from "@/lib/orderStatus";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

/**
 * Storefront customer orders only (not POS `sales` — those are already
 * complete at time of sale, no review/fulfillment pipeline needed). Staff
 * and Owner share this endpoint; Owner's /api/admin/orders additionally
 * unions in POS sales for the full transaction ledger.
 */
export async function GET() {
  const gate = await requireRole(ROLE_GROUPS.MANAGERIAL);
  if (!gate.ok) return gate.response;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, order_code, shipping_name, shipping_phone, payment_method,
            subtotal_ks, delivery_fee_ks, discount_ks, total_ks, status,
            payment_proof_url, payment_status, created_at
     FROM orders
     ORDER BY created_at DESC, id DESC
     LIMIT 100`
  );

  return NextResponse.json({ success: true, data: rows });
}

/**
 * Two actions in one endpoint, discriminated by which field is present:
 *   - { order_id, decision } — review a KBZ Pay payment screenshot.
 *   - { order_id, status }   — advance the fulfillment pipeline.
 */
export async function PATCH(request: Request) {
  const gate = await requireRole(ROLE_GROUPS.MANAGERIAL);
  if (!gate.ok) return gate.response;

  const body = (await request.json()) as {
    order_id?: number;
    decision?: "confirmed" | "rejected";
    status?: string;
  };
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
