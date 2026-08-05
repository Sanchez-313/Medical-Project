import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

const TAX_RATE = 0.05;

/** Light POS for the agent portal. An agent only ever sees sales they handled; staff/owner see all. */
export async function GET() {
  const gate = await requireRole(ROLE_GROUPS.OPERATIONAL);
  if (!gate.ok) return gate.response;

  const isAgent = gate.session.user.role === "agent";

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT sale_code, customer_name, payment_method, total_ks, created_at
     FROM sales
     ${isAgent ? "WHERE handled_by_user_id = :handledBy" : ""}
     ORDER BY created_at DESC
     LIMIT 20`,
    isAgent ? { handledBy: Number(gate.session.user.id) } : undefined
  );

  return NextResponse.json({ success: true, data: rows });
}

/** Atomic stock decrement + sale + sale_items insert, same pattern as /api/staff/sales. */
export async function POST(request: Request) {
  const gate = await requireRole(ROLE_GROUPS.OPERATIONAL);
  if (!gate.ok) return gate.response;

  const body = await request.json();
  const { customerName, customerPhone, paymentMethod, items } = body as {
    customerName?: string;
    customerPhone?: string;
    paymentMethod: string;
    items: Array<{ medicineId: number; qty: number }>;
  };

  if (!items?.length) {
    return NextResponse.json({ success: false, message: "at least one item is required" }, { status: 400 });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let subtotalKs = 0;
    const lineItems: Array<{ medicineId: number; qty: number; unitPriceKs: number; totalPriceKs: number }> = [];

    for (const line of items) {
      const [rows] = await connection.query<RowDataPacket[]>(
        "SELECT id, selling_price_ks, stock_qty FROM medicines WHERE id = :id AND is_active = 1 FOR UPDATE",
        { id: line.medicineId }
      );
      const medicine = rows[0];
      if (!medicine) throw new Error(`Medicine ${line.medicineId} not found or inactive`);
      if (medicine.stock_qty < line.qty) throw new Error(`Insufficient stock for medicine ${line.medicineId}`);

      const lineTotal = medicine.selling_price_ks * line.qty;
      subtotalKs += lineTotal;
      lineItems.push({
        medicineId: medicine.id,
        qty: line.qty,
        unitPriceKs: medicine.selling_price_ks,
        totalPriceKs: lineTotal,
      });

      await connection.query(
        "UPDATE medicines SET stock_qty = stock_qty - :qty WHERE id = :id",
        { qty: line.qty, id: medicine.id }
      );
    }

    const taxKs = Math.round(subtotalKs * TAX_RATE);
    const totalKs = subtotalKs + taxKs;
    const saleCode = `PORTAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const [saleResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO sales (sale_code, handled_by_user_id, customer_name, customer_phone, payment_method, subtotal_ks, tax_ks, total_ks, status)
       VALUES (:sale_code, :handled_by, :customer_name, :customer_phone, :payment_method, :subtotal_ks, :tax_ks, :total_ks, 'completed')`,
      {
        sale_code: saleCode,
        handled_by: Number(gate.session.user.id),
        customer_name: customerName ?? null,
        customer_phone: customerPhone ?? null,
        payment_method: paymentMethod,
        subtotal_ks: subtotalKs,
        tax_ks: taxKs,
        total_ks: totalKs,
      }
    );
    const saleId = saleResult.insertId;

    for (const item of lineItems) {
      await connection.query(
        `INSERT INTO sale_items (sale_id, medicine_id, qty, unit_price_ks, total_price_ks)
         VALUES (:sale_id, :medicine_id, :qty, :unit_price_ks, :total_price_ks)`,
        {
          sale_id: saleId,
          medicine_id: item.medicineId,
          qty: item.qty,
          unit_price_ks: item.unitPriceKs,
          total_price_ks: item.totalPriceKs,
        }
      );
    }

    await connection.commit();
    return NextResponse.json({ success: true, data: { saleId, saleCode, subtotalKs, taxKs, totalKs } }, { status: 201 });
  } catch (error) {
    await connection.rollback();
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Unable to process sale" },
      { status: 400 }
    );
  } finally {
    connection.release();
  }
}
