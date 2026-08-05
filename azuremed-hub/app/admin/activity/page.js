"use client";

import { useEffect, useState } from "react";
import { UserPlus, ShoppingBag, ClipboardList, ScanLine } from "lucide-react";

const TYPE_META = {
  registration: { icon: UserPlus, color: "bg-purple-50 text-purple-500" },
  order: { icon: ShoppingBag, color: "bg-emerald-50 text-emerald-500" },
  sale: { icon: ClipboardList, color: "bg-blue-50 text-blue-500" },
  detection: { icon: ScanLine, color: "bg-amber-50 text-amber-500" },
};

export default function ActivityLogPage() {
  const [activity, setActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/activity")
      .then((r) => r.json())
      .then((result) => setActivity(result.success ? result.data : []))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">Activity Log</h1>
        <p className="pt-3 text-slate-500">
          Live feed of registrations, storefront orders, POS sales, and AI detections.
        </p>
      </div>

      <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
        {isLoading && <p className="py-16 text-center font-bold text-slate-400">Loading...</p>}
        {!isLoading && activity.length === 0 && (
          <p className="py-16 text-center font-bold text-slate-400">No activity yet.</p>
        )}
        <div className="space-y-6">
          {activity.map((event, i) => {
            const meta = TYPE_META[event.type] ?? TYPE_META.registration;
            const Icon = meta.icon;
            return (
              <div key={i} className="flex gap-4">
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${meta.color}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">{event.description}</p>
                  <p className="mt-0.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {new Date(event.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
