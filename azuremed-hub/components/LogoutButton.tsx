"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className={`rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 ${className}`}
    >
      Sign out
    </button>
  );
}
