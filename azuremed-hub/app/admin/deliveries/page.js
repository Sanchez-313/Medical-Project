import { Truck } from "lucide-react";

/**
 * The original Admin-Dashboard/src/components/DeliveryTracking/DeliveryTracking.jsx
 * tracked shipment handoff status per order. This schema has no deliveries
 * table yet (sales here are point-of-sale checkouts, not shipped orders), so
 * this is an honest placeholder rather than fabricated tracking data.
 */
export default function DeliveriesPage() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[2.5rem] border border-slate-100 bg-white p-16 text-center shadow-sm">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
        <Truck size={24} />
      </div>
      <h2 className="text-xl font-black text-slate-800">Delivery tracking not migrated yet</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        This needs a new <code>deliveries</code> table and handoff-status
        workflow, ported from the original DeliveryTracking screen. Not built
        yet — say the word and I&apos;ll add it.
      </p>
    </div>
  );
}
