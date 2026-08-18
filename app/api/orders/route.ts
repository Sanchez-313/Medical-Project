import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import { createOrder, savePaymentProofImage, type ShippingInfo } from "@/lib/orders";
import type { RowDataPacket } from "mysql2";

/** Customer's own order history, most recent first, with line items. */
export async function GET() {
  const gate = await requireRole(ROLE_GROUPS.ANY_AUTHENTICATED);
  if (!gate.ok) return gate.response;

  const userId = Number(gate.session.user.id);

  const [orders] = await pool.query<RowDataPacket[]>(
    `SELECT id, order_code, payment_method, shipping_name, shipping_phone, shipping_city,
            subtotal_ks, tax_ks, delivery_fee_ks, discount_ks, promo_code, total_ks,
            status, payment_proof_url, payment_status, created_at
     FROM orders WHERE user_id = :userId ORDER BY created_at DESC`,
    { userId }
  );

  for (const order of orders) {
    const [items] = await pool.query<RowDataPacket[]>(
      `SELECT oi.qty, oi.unit_price_ks, oi.total_price_ks, m.name
       FROM order_items oi JOIN medicines m ON m.id = oi.medicine_id
       WHERE oi.order_id = :orderId`,
      { orderId: order.id }
    );
    order.items = items;
  }

  return NextResponse.json({ success: true, data: { orders } });
}

/**
 * multipart/form-data: payment_method, shipping (JSON string), items (JSON
 * string of [{product_id, qty}]), and an optional `payment_proof` image file
 * (required for kpay). The screenshot is only stored for a human Owner to
 * review on /admin/orders — nothing here reads or verifies its contents.
 */
export async function POST(request: Request) {
  const gate = await requireRole(ROLE_GROUPS.ANY_AUTHENTICATED);
  if (!gate.ok) return gate.response;

  const formData = await request.formData();
  const payment_method = formData.get("payment_method") as "kpay" | "cod" | null;
  if (payment_method !== "kpay" && payment_method !== "cod") {
    return NextResponse.json({ success: false, message: "payment_method must be 'kpay' or 'cod'" }, { status: 400 });
  }
  let shipping: ShippingInfo;
  let items: Array<{ product_id: number; qty: number }>;
  try {
    shipping = JSON.parse(formData.get("shipping") as string);
    items = JSON.parse(formData.get("items") as string);
  } catch {
    return NextResponse.json({ success: false, message: "Malformed shipping/items payload" }, { status: 400 });
  }

  if (!items?.length) {
    return NextResponse.json({ success: false, message: "Cart is empty" }, { status: 400 });
  }
  if (!shipping?.fullName || !shipping?.email || !shipping?.phone || !shipping?.city || !shipping?.address) {
    return NextResponse.json({ success: false, message: "Shipping details are required" }, { status: 400 });
  }

  const promoCodeInput = (formData.get("promo_code") as string | null)?.trim().toUpperCase() || null;

  const proofFile = formData.get("payment_proof");
  if (payment_method === "kpay" && !(proofFile instanceof File)) {
    return NextResponse.json(
      { success: false, message: "A KBZ Pay payment screenshot is required" },
      { status: 400 }
    );
  }

  let paymentProofUrl: string | null = null;
  if (proofFile instanceof File) {
    try {
      paymentProofUrl = await savePaymentProofImage(proofFile);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save payment screenshot";
      const status = message.includes("5MB") ? 413 : 415;
      return NextResponse.json({ success: false, message }, { status });
    }
  }

  const userId = Number(gate.session.user.id);

  try {
    const order = await createOrder({
      userId,
      paymentMethod: payment_method,
      shipping,
      items,
      promoCodeInput,
      paymentProofUrl,
      clearCartForUserId: userId,
    });
    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Could not place order" },
      { status: 400 }
    );
  }
}
