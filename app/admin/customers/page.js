"use client";

import { useEffect, useState } from "react";
import { Search, Users } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    fetch(`/api/admin/customers?${params}`)
      .then((r) => r.json())
      .then((result) => mounted && setCustomers(result.success ? result.data : []))
      .finally(() => mounted && setIsLoading(false));
    return () => {
      mounted = false;
    };
  }, [search]);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">ဖောက်သည်များ</h1>
          <p className="pt-3 text-slate-500">Registered storefront customers.</p>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/10"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-50 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
              <th className="px-8 py-5">Customer</th>
              <th className="px-6 py-5">Email</th>
              <th className="px-6 py-5">Orders Placed</th>
              <th className="px-6 py-5">Total Spent</th>
              <th className="px-6 py-5">Registered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading && (
              <tr><td colSpan={4} className="px-8 py-16 text-center font-bold text-slate-400">Loading...</td></tr>
            )}
            {!isLoading && customers.length === 0 && (
              <tr><td colSpan={5} className="px-8 py-16 text-center font-bold text-slate-400">No customers found.</td></tr>
            )}
            {!isLoading &&
              customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50/50">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-purple-500">
                        <Users size={16} />
                      </div>
                      <p className="text-sm font-black text-slate-800">{customer.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-600">{customer.email}</td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-700">{customer.orderCount}</td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-700">
                    {Number(customer.totalSpentKs).toLocaleString()} Ks
                  </td>
                  <td className="px-6 py-5 text-xs font-semibold text-slate-400">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
