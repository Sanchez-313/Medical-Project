"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import AuthShell, { SocialRow } from "@/components/AuthShell";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await signIn("credentials", { email, password, redirect: false });
    setSubmitting(false);

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    const session = await fetch("/api/auth/session").then((r) => r.json());
    const role = session?.user?.role;
    router.push(role === "owner" ? "/admin" : role === "staff" ? "/staff" : role === "agent" ? "/portal" : "/");
  }

  return (
    <AuthShell
      formSide="right"
      teaser={{
        eyebrow: "Need an account?",
        title: "Join our wellness community",
        description:
          "Create a health profile to manage your digital prescriptions, refill history, and expert pharmacist consultations.",
        ctaLabel: "Create Health Profile",
        ctaHref: "/register",
      }}
    >
      <h1 className="text-2xl font-bold text-slate-800">Welcome Back</h1>
      <p className="mt-1 text-sm text-slate-500">
        Sign in to access AI medicine detection and your account.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Patient Email / Health ID
          </label>
          <input
            type="email"
            placeholder="e.g. john.doe@healthcare.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-full border border-brand-muted px-4 py-2.5 text-sm outline-none focus:border-brand"
            required
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Security Password
            </label>
            <span className="text-xs font-medium text-brand">Forgot password?</span>
          </div>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-full border border-brand-muted px-4 py-2.5 text-sm outline-none focus:border-brand"
            required
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-500">
          <input
            type="checkbox"
            checked={keepLoggedIn}
            onChange={(e) => setKeepLoggedIn(e.target.checked)}
            className="rounded border-brand-muted text-brand"
          />
          Keep me logged in
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
        >
          {submitting ? "Signing in..." : "Secure Login"}
        </button>
      </form>

      <SocialRow />
    </AuthShell>
  );
}
