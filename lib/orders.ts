import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import pool from "@/config/db";
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

/**
 * Validates and saves a KBZ Pay payment screenshot, shared by the website
 * checkout (which gets the file straight from the browser's <input
 * type="file">) and the bot checkout (which downloads it from Telegram
 * first — see app/api/orders/telegram/route.ts — then forwards the same
 * bytes here). Throws on an invalid file; caller turns that into the
 * appropriate HTTP response.
 */
export async function savePaymentProofImage(file: File): Promise<string> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("unsupported image type");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("image exceeds 5MB limit");
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${randomUUID()}.${EXTENSION_BY_MIME[file.type]}`;
  await writeFile(path.join(UPLOAD_DIR, filename), bytes);
  return `/uploads/payment-proofs/${filename}`;
}

export interface ShippingInfo {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
}

export interface CreateOrderParams {
  userId: number;
  paymentMethod: "kpay" | "cod";
  shipping: ShippingInfo;
  items: Array<{ product_id: number; qty: number }>;
  promoCodeInput: string | null;
  paymentProofUrl: string | null;
  /** Set when this order came in through the Telegram bot — see
   * app/api/orders/telegram/route.ts. Lets staff see/contact the real
   * Telegram customer even though `userId` is the shared service account. */
  telegramChatId?: number | null;
  telegramUsername?: string | null;
  /** Pass the session's userId here for a website checkout (the customer's
   * own cart_items get released/cleared as part of the same transaction).
   * Omit for bot orders — there's no cart_items row to clean up since the
   * bot never touches the cart tables. */
  clearCartForUserId?: number | null;
}

export interface CreateOrderResult {
  order_code: string;
  subtotal_ks: number;
  tax_ks: number;
  delivery_fee_ks: number;
  discount_ks: number;
  total_ks: number;
  status: "pending";
}

/**
 * Shared by the website's authenticated checkout (app/api/orders/route.ts)
 * and the bot's guest-style checkout (app/api/orders/telegram/route.ts) —
 * both need the exact same stock-locking/pricing/transaction behavior;
 * duplicating it would only take one of them out of sync with the other's
 * bug fixes over time. Callers are responsible for validating the request
 * shape and handling the payment-proof file upload before calling this —
 * this function only touches the DB.
 */
export async function createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
  const { userId, paymentMethod, shipping, items, promoCodeInput, paymentProofUrl, telegramChatId, telegramUsername } = params;

  if (!items?.length) {
    throw new Error("Cart is empty");
  }
  if (!shipping?.fullName || !shipping?.email || !shipping?.phone || !shipping?.city || !shipping?.address) {
    throw new Error("Shipping details are required");
  }

  const paymentStatus = paymentMethod === "kpay" ? "pending_review" : "not_required";

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
    // trusted from the caller — the website only ever saw a preview via
    // /api/promo/validate and /api/settings/public, and the bot doesn't get
    // to see either.
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
      `INSERT INTO orders (order_code, user_id, payment_method, shipping_name, shipping_email, shipping_phone, shipping_city, shipping_address, subtotal_ks, tax_ks, delivery_fee_ks, discount_ks, promo_code, total_ks, status, payment_proof_url, payment_status, telegram_chat_id, telegram_username)
       VALUES (:order_code, :user_id, :payment_method, :name, :email, :phone, :city, :address, :subtotal, :tax, :delivery_fee, :discount, :promo_code, :total, 'pending', :payment_proof_url, :payment_status, :telegram_chat_id, :telegram_username)`,
      {
        order_code: orderCode,
        user_id: userId,
        payment_method: paymentMethod,
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
        telegram_chat_id: telegramChatId ?? null,
        telegram_username: telegramUsername ?? null,
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

    // Only the website checkout has a real cart_items row to clean up — the
    // bot never writes to cart_items in the first place.
    if (params.clearCartForUserId != null) {
      const cartUserId = params.clearCartForUserId;
      // Release whatever this cart had reserved before deleting it — these
      // holds are converting into a real stock_qty decrement above, not
      // lapsing, but reserved_qty still needs to come back down or the stock
      // stays phantom-held forever. Read the server's own cart rows here
      // rather than trust the caller's `items` qtys, since those two should
      // match but only one of them is authoritative.
      const [cartRows] = await connection.query<RowDataPacket[]>(
        "SELECT medicine_id, qty FROM cart_items WHERE user_id = :userId FOR UPDATE",
        { userId: cartUserId }
      );
      for (const row of cartRows) {
        await connection.query("UPDATE medicines SET reserved_qty = GREATEST(reserved_qty - :qty, 0) WHERE id = :id", {
          qty: row.qty,
          id: row.medicine_id,
        });
      }
      await connection.query("DELETE FROM cart_items WHERE user_id = :userId", { userId: cartUserId });
    }

    await connection.commit();

    return {
      order_code: orderCode,
      subtotal_ks: subtotalKs,
      tax_ks: taxKs,
      delivery_fee_ks: deliveryFeeKs,
      discount_ks: discountKs,
      total_ks: totalKs,
      status: "pending",
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
