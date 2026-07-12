"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import AuthShell, { SocialRow } from "@/components/AuthShell";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, password }),
    });
    const result = await response.json();

    if (!result.success) {
      setSubmitting(false);
      setError(result.message ?? "Unable to create your profile");
      return;
    }

    // Auto sign-in right after registration so the flow feels seamless.
    const signInResult = await signIn("credentials", { email, password, redirect: false });
    setSubmitting(false);

    if (signInResult?.error) {
      router.push("/login");
      return;
    }
    router.push("/");
  }

  return (
    <AuthShell
      formSide="left"
      teaser={{
        eyebrow: "Already registered?",
        title: "Welcome back",
        description:
          "Already have a health profile? Sign in to view your medication refill history and coordinate with your pharmacist.",
        ctaLabel: "Authorize Sign In",
        ctaHref: "/login",
      }}
    >
      <h1 className="text-2xl font-bold text-slate-800">Create Your Profile</h1>
      <p className="mt-1 text-sm text-slate-500">
        Register to access exclusive pharmacy discounts, manage digital prescriptions, and track your wellness journey.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              First Name
            </label>
            <input
              type="text"
              placeholder="e.g. John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 w-full rounded-full border border-brand-muted px-4 py-2.5 text-sm outline-none focus:border-brand"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Last Name
            </label>
            <input
              type="text"
              placeholder="e.g. Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1 w-full rounded-full border border-brand-muted px-4 py-2.5 text-sm outline-none focus:border-brand"
              required
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Registered Email
          </label>
          <input
            type="email"
            placeholder="name@healthcare.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-full border border-brand-muted px-4 py-2.5 text-sm outline-none focus:border-brand"
            required
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Security Password
          </label>
          <input
            type="password"
            placeholder="Minimum 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            className="mt-1 w-full rounded-full border border-brand-muted px-4 py-2.5 text-sm outline-none focus:border-brand"
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
        >
          {submitting ? "Creating account..." : "Register Account"}
        </button>
      </form>

      <SocialRow />
    </AuthShell>
  );
}
