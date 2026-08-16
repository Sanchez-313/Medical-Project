import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

const TAX_RATE = 0.05;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "payment-proofs");

interface ShippingInfo {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
}

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
    if (!ALLOWED_MIME_TYPES.has(proofFile.type)) {
      return NextResponse.json({ success: false, message: "unsupported image type" }, { status: 415 });
    }
    if (proofFile.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ success: false, message: "image exceeds 5MB limit" }, { status: 413 });
    }
    const bytes = Buffer.from(await proofFile.arrayBuffer());
    await mkdir(UPLOAD_DIR, { recursive: true });
    const filename = `${randomUUID()}.${EXTENSION_BY_MIME[proofFile.type]}`;
    await writeFile(path.join(UPLOAD_DIR, filename), bytes);
    paymentProofUrl = `/uploads/payment-proofs/${filename}`;
  }

  const paymentStatus = payment_method === "kpay" ? "pending_review" : "not_required";

  const userId = Number(gate.session.user.id);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    let subtotalKs = 0;
    const lineItems: Array<{ medicineId: number; qty: number; unitPriceKs: number; totalPriceKs: number }> = [];

    for (const line of items) {
      const [[medicine]] = await connection.query<RowDataPacket[]>(
        "SELECT id, name, selling_price_ks, stock_qty FROM medicines WHERE id = :id AND is_active = 1 FOR UPDATE",
        { id: line.product_id }
      );
      if (!medicine) throw new Error(`Product ${line.product_id} not found`);
      if (medicine.stock_qty < line.qty) throw new Error(`${medicine.name} only has ${medicine.stock_qty} in stock`);

      const lineTotal = medicine.selling_price_ks * line.qty;
      subtotalKs += lineTotal;
      lineItems.push({ medicineId: medicine.id, qty: line.qty, unitPriceKs: medicine.selling_price_ks, totalPriceKs: lineTotal });

      await connection.query("UPDATE medicines SET stock_qty = stock_qty - :qty WHERE id = :id", {
        qty: line.qty,
        id: medicine.id,
      });
    }

    // Discount and delivery fee are always recomputed here from the DB, never
    // trusted from the client — the client only ever saw a preview via
    // /api/promo/validate and /api/settings/public.
    let discountKs = 0;
    if (promoCodeInput) {
      const [[promo]] = await connection.query<RowDataPacket[]>(
        "SELECT discount_percent FROM promo_codes WHERE code = :code AND is_active = 1",
        { code: promoCodeInput }
      );
      if (!promo) throw new Error("Promo code is no longer valid");
      discountKs = Math.round((subtotalKs * promo.discount_percent) / 100);
    }

    const [[storeSettings]] = await connection.query<RowDataPacket[]>(
      "SELECT delivery_fee_ks, free_delivery_threshold_ks FROM store_settings WHERE id = 1"
    );
    const freeDeliveryThresholdKs = storeSettings?.free_delivery_threshold_ks ?? 0;
    // Every order still ships — there's no in-store pickup in this app —
    // reaching the threshold only waives the fee, same rule as the checkout
    // page preview in app/(storefront)/checkout/page.tsx.
    const deliveryFeeKs =
      freeDeliveryThresholdKs > 0 && subtotalKs >= freeDeliveryThresholdKs ? 0 : storeSettings?.delivery_fee_ks ?? 0;

    const taxKs = Math.round(subtotalKs * TAX_RATE);
    const totalKs = subtotalKs + taxKs + deliveryFeeKs - discountKs;
    const orderCode = `ORD-${Date.now()}`;

    const [orderResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO orders (order_code, user_id, payment_method, shipping_name, shipping_email, shipping_phone, shipping_city, shipping_address, subtotal_ks, tax_ks, delivery_fee_ks, discount_ks, promo_code, total_ks, status, payment_proof_url, payment_status)
       VALUES (:order_code, :user_id, :payment_method, :name, :email, :phone, :city, :address, :subtotal, :tax, :delivery_fee, :discount, :promo_code, :total, 'pending', :payment_proof_url, :payment_status)`,
      {
        order_code: orderCode,
        user_id: userId,
        payment_method,
        name: shipping.fullName,
        email: shipping.email,
        phone: shipping.phone,
        city: shipping.city,
        address: shipping.address,
        subtotal: subtotalKs,
        tax: taxKs,
        delivery_fee: deliveryFeeKs,
        discount: discountKs,
        promo_code: promoCodeInput,
        total: totalKs,
        payment_proof_url: paymentProofUrl,
        payment_status: paymentStatus,
      }
    );
    const orderId = orderResult.insertId;

    for (const item of lineItems) {
      await connection.query(
        `INSERT INTO order_items (order_id, medicine_id, qty, unit_price_ks, total_price_ks)
         VALUES (:order_id, :medicine_id, :qty, :unit_price_ks, :total_price_ks)`,
        { order_id: orderId, medicine_id: item.medicineId, qty: item.qty, unit_price_ks: item.unitPriceKs, total_price_ks: item.totalPriceKs }
      );
    }

    await connection.query("DELETE FROM cart_items WHERE user_id = :userId", { userId });

    await connection.commit();

    return NextResponse.json(
      {
        success: true,
        data: {
          order_code: orderCode,
          subtotal_ks: subtotalKs,
          tax_ks: taxKs,
          delivery_fee_ks: deliveryFeeKs,
          discount_ks: discountKs,
          total_ks: totalKs,
          status: "pending",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    await connection.rollback();
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Could not place order" },
      { status: 400 }
    );
  } finally {
    connection.release();
  }
}
