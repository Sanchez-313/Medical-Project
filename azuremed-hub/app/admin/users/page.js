"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Shield, ShieldOff, UserPlus } from "lucide-react";

const ROLE_BADGE = {
  admin: "bg-purple-100 text-purple-700",
  staff: "bg-blue-100 text-blue-700",
  user: "bg-slate-100 text-slate-600",
};

const CREATABLE_ROLES = ["staff", "admin", "user"];
const ROLE_DISPLAY_LABEL = { staff: "Staff", admin: "Admin", user: "User" };

const ROLE_TABS = [
  { key: "all", label: "All" },
  { key: "admin", label: "Admin" },
  { key: "staff", label: "Staff" },
  { key: "user", label: "User" },
];

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleTab, setRoleTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "staff" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  function loadUsers() {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    fetch(`/api/admin/users?${params}`)
      .then((r) => r.json())
      .then((result) => setUsers(result.success ? result.data : []))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const roleCounts = useMemo(() => {
    const counts = { all: users.length, owner: 0, staff: 0, user: 0 };
    for (const u of users) {
      if (counts[u.role] !== undefined) counts[u.role] += 1;
    }
    return counts;
  }, [users]);

  const visibleUsers = useMemo(
    () => (roleTab === "all" ? users : users.filter((u) => u.role === roleTab)),
    [users, roleTab]
  );

  async function toggleActive(user) {
    setUpdatingId(user.id);
    const result = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, is_active: !user.is_active }),
    }).then((r) => r.json());
    setUpdatingId(null);

    if (!result.success) {
      alert(result.message);
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u)));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    const result = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).then((r) => r.json());
    setCreating(false);

    if (!result.success) {
      setCreateError(result.message ?? "Could not create account");
      return;
    }
    setShowCreate(false);
    setForm({ name: "", email: "", password: "", role: "staff" });
    loadUsers();
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">User Management</h1>
          <p className="pt-3 text-slate-500">Block or approve any account, across every role.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/10"
              placeholder="Search name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black uppercase text-white shadow-md shadow-blue-100 hover:bg-blue-700"
          >
            <UserPlus size={16} /> Create Account
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
        <div className="flex border-b border-slate-100 px-8">
          {ROLE_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setRoleTab(tab.key)}
              className={`flex items-center gap-2 border-b-2 px-5 pb-4 pt-6 text-xs font-black uppercase tracking-widest transition-all ${
                roleTab === tab.key ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] ${
                  roleTab === tab.key ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {roleCounts[tab.key]}
              </span>
            </button>
          ))}
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-50 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
              <th className="px-8 py-5">User</th>
              <th className="px-6 py-5">Email</th>
              <th className="px-6 py-5">Role</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5">Registered</th>
              <th className="px-6 py-5">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading && (
              <tr><td colSpan={6} className="px-8 py-16 text-center font-bold text-slate-400">Loading...</td></tr>
            )}
            {!isLoading && visibleUsers.length === 0 && (
              <tr><td colSpan={6} className="px-8 py-16 text-center font-bold text-slate-400">No users found.</td></tr>
            )}
            {!isLoading &&
              visibleUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50">
                  <td className="px-8 py-5 text-sm font-black text-slate-800">{user.name}</td>
                  <td className="px-6 py-5 text-sm text-slate-600">{user.email}</td>
                  <td className="px-6 py-5">
                    <span className={`rounded-lg px-3 py-1 text-[10px] font-black uppercase ${ROLE_BADGE[user.role] ?? ROLE_BADGE.user}`}>
                      {ROLE_DISPLAY_LABEL[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`rounded-lg px-3 py-1 text-[10px] font-black uppercase ${
                        user.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.is_active ? "Active" : "Blocked"}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-xs font-semibold text-slate-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-5">
                    <button
                      type="button"
                      onClick={() => toggleActive(user)}
                      disabled={updatingId === user.id}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black shadow-sm disabled:opacity-50 ${
                        user.is_active
                          ? "bg-red-50 text-red-700 hover:bg-red-100"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      {user.is_active ? <ShieldOff size={14} /> : <Shield size={14} />}
                      {updatingId === user.id ? "Saving..." : user.is_active ? "Block" : "Approve"}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900">Create Account</h3>
            <p className="mt-1 text-sm text-slate-500">
              Staff and Admin accounts can only be created here — public sign-up always creates a customer account.
            </p>

            <form onSubmit={handleCreate} className="mt-6 space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Temporary Password (min 8 characters)
                </label>
                <input
                  type="text"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50"
                >
                  {CREATABLE_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_DISPLAY_LABEL[role]}
                    </option>
                  ))}
                </select>
              </div>

              {createError && <p className="text-sm text-red-600">{createError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    setCreateError("");
                  }}
                  disabled={creating}
                  className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
