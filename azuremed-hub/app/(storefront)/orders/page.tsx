import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/config/db";
import type { RowDataPacket } from "mysql2";

// Explicit, not relying on searchParams/getServerSession usage alone to
// signal dynamic rendering to Next — a build-time DB connection to a host
// unreachable from Vercel's build servers (like localhost) is fatal either way.
export const dynamic = "force-dynamic";

/** Ported from Medical_Product/src/components/Orders/Orders.jsx ("Purchase Bills"). */
export default async function PurchaseBillsPage({
  searchParams,
}: {
  searchParams: { placed?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const [orders] = await pool.query<RowDataPacket[]>(
    `SELECT id, order_code, payment_method, shipping_name, shipping_phone, subtotal_ks, tax_ks,
            delivery_fee_ks, discount_ks, promo_code, total_ks, status, payment_status, created_at
     FROM orders WHERE user_id = :userId ORDER BY created_at DESC`,
    { userId: Number(session.user.id) }
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

  const timesBought = orders.length;
  const itemsPurchased = orders.reduce(
    (sum, order) => sum + order.items.reduce((s: number, item: RowDataPacket) => s + item.qty, 0),
    0
  );
  const totalSpent = orders.reduce((sum, order) => sum + order.total_ks, 0);

  return (
    <div className="mx-auto max-w-5xl px-6 py-28 sm:px-10">
      <h1 className="text-3xl font-bold text-zinc-800">Purchase Bills</h1>
      <p className="mt-1 text-sm text-zinc-500">Your complete order history and billing details.</p>

      {searchParams.placed && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700">
          Order {searchParams.placed} placed successfully!
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Times Bought</p>
          <p className="mt-2 text-2xl font-black text-zinc-900">{timesBought}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Items Purchased</p>
          <p className="mt-2 text-2xl font-black text-zinc-900">{itemsPurchased}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Total Spent</p>
          <p className="mt-2 text-2xl font-black text-zinc-900">{totalSpent.toLocaleString()} MMK</p>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {orders.length === 0 && (
          <p className="py-16 text-center text-zinc-500">You haven&apos;t placed any orders yet.</p>
        )}
        {orders.map((order, index) => (
          <div key={order.id} className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-zinc-800">Bill #{orders.length - index}</p>
                <p className="text-xs text-zinc-400">
                  {new Date(order.created_at).toLocaleString()} | {order.order_code}
                </p>
              </div>
              <div className="flex gap-2">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase text-blue-700">
                  {order.payment_method === "kpay" ? "KBZ Pay" : "Cash on Delivery"}
                </span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase text-amber-700">
                  {order.status}
                </span>
                {order.payment_status === "pending_review" && (
                  <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold uppercase text-yellow-700">
                    Payment Under Review
                  </span>
                )}
                {order.payment_status === "confirmed" && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase text-emerald-700">
                    Payment Verified
                  </span>
                )}
                {order.payment_status === "rejected" && (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold uppercase text-red-700">
                    Payment Rejected
                  </span>
                )}
              </div>
            </div>

            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-zinc-400">
                  <th className="py-2">Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item: RowDataPacket, i: number) => (
                  <tr key={i} className="border-t border-zinc-100">
                    <td className="py-2 font-semibold text-zinc-800">{item.name}</td>
                    <td>{item.qty}</td>
                    <td>{Number(item.unit_price_ks).toLocaleString()} MMK</td>
                    <td className="font-bold text-zinc-900">{Number(item.total_price_ks).toLocaleString()} MMK</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 ml-auto w-full max-w-xs space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Subtotal</span>
                <span className="font-bold text-zinc-800">{Number(order.subtotal_ks).toLocaleString()} MMK</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Tax (5%)</span>
                <span className="font-bold text-zinc-800">{Number(order.tax_ks).toLocaleString()} MMK</span>
              </div>
              {Number(order.delivery_fee_ks) > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Delivery Fee</span>
                  <span className="font-bold text-zinc-800">{Number(order.delivery_fee_ks).toLocaleString()} MMK</span>
                </div>
              )}
              {Number(order.discount_ks) > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Promo ({order.promo_code})</span>
                  <span className="font-bold text-emerald-600">-{Number(order.discount_ks).toLocaleString()} MMK</span>
                </div>
              )}
              <div className="flex justify-between border-t border-zinc-200 pt-2">
                <span className="font-black text-zinc-700">Total</span>
                <span className="font-black text-blue-700">{Number(order.total_ks).toLocaleString()} MMK</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
