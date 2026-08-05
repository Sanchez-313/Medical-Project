export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

/**
 * Forward-only fulfillment pipeline, shared by /api/staff/orders and
 * /api/admin/orders so both enforce the same rules. 'confirmed' is normally
 * reached via payment-proof review (see reviewPaymentProof in each route),
 * not this endpoint directly, but COD orders skip that step so pending ->
 * processing is also valid.
 */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "processing", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export function canTransition(from: string, to: string): to is OrderStatus {
  const fromTransitions = ALLOWED_TRANSITIONS[from as OrderStatus];
  return Boolean(fromTransitions?.includes(to as OrderStatus));
}
