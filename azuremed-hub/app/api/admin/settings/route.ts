import { NextResponse } from "next/server";
import pool from "@/config/db";
import { requireRole, ROLE_GROUPS } from "@/lib/rbac";
import type { RowDataPacket } from "mysql2";

export async function GET() {
  const gate = await requireRole(ROLE_GROUPS.OWNER_ONLY);
  if (!gate.ok) return gate.response;

  const [[settings]] = await pool.query<RowDataPacket[]>(
    "SELECT delivery_fee_ks, free_delivery_threshold_ks, low_stock_default_threshold FROM store_settings WHERE id = 1"
  );

  return NextResponse.json({ success: true, data: settings });
}

export async function PATCH(request: Request) {
  const gate = await requireRole(ROLE_GROUPS.OWNER_ONLY);
  if (!gate.ok) return gate.response;

  const { delivery_fee_ks, free_delivery_threshold_ks, low_stock_default_threshold } = (await request.json()) as {
    delivery_fee_ks?: number;
    free_delivery_threshold_ks?: number;
    low_stock_default_threshold?: number;
  };

  if (
    (delivery_fee_ks !== undefined && (!Number.isInteger(delivery_fee_ks) || delivery_fee_ks < 0)) ||
    (free_delivery_threshold_ks !== undefined &&
      (!Number.isInteger(free_delivery_threshold_ks) || free_delivery_threshold_ks < 0)) ||
    (low_stock_default_threshold !== undefined &&
      (!Number.isInteger(low_stock_default_threshold) || low_stock_default_threshold < 0))
  ) {
    return NextResponse.json({ success: false, message: "Values must be non-negative whole numbers" }, { status: 400 });
  }

  const sets: string[] = [];
  const params: Record<string, number> = {};
  if (delivery_fee_ks !== undefined) {
    sets.push("delivery_fee_ks = :delivery_fee_ks");
    params.delivery_fee_ks = delivery_fee_ks;
  }
  if (free_delivery_threshold_ks !== undefined) {
    sets.push("free_delivery_threshold_ks = :free_delivery_threshold_ks");
    params.free_delivery_threshold_ks = free_delivery_threshold_ks;
  }
  if (low_stock_default_threshold !== undefined) {
    sets.push("low_stock_default_threshold = :low_stock_default_threshold");
    params.low_stock_default_threshold = low_stock_default_threshold;
  }
  if (!sets.length) {
    return NextResponse.json({ success: false, message: "No fields to update" }, { status: 400 });
  }

  await pool.query(`UPDATE store_settings SET ${sets.join(", ")} WHERE id = 1`, params);

  return NextResponse.json({ success: true });
}
