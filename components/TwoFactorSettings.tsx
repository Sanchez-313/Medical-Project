"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, ShieldOff, ArrowLeft } from "lucide-react";

type Status = "loading" | "disabled" | "enabled" | "setting_up";

export default function TwoFactorSettings({ backHref }: { backHref: string }) {
  const [status, setStatus] = useState<Status>("loading");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/account/2fa/status")
      .then((r) => r.json())
      .then((result) => setStatus(result.success && result.data.enabled ? "enabled" : "disabled"));
  }, []);

  async function startSetup() {
    setError("");
    setBusy(true);
    const result = await fetch("/api/account/2fa/setup", { method: "POST" }).then((r) => r.json());
    setBusy(false);
    if (!result.success) {
      setError("Could not start setup. Please try again.");
      return;
    }
    setSecret(result.data.secret);
    setQrCodeDataUrl(result.data.qrCodeDataUrl);
    setStatus("setting_up");
  }

  async function confirmSetup(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const result = await fetch("/api/account/2fa/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }).then((r) => r.json());
    setBusy(false);
    if (!result.success) {
      setError(result.message ?? "Incorrect code");
      return;
    }
    setCode("");
    setNotice("Two-factor authentication is now enabled.");
    setStatus("enabled");
  }

  async function disable(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const result = await fetch("/api/account/2fa/disable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).then((r) => r.json());
    setBusy(false);
    if (!result.success) {
      setError(result.message ?? "Could not disable 2FA");
      return;
    }
    setPassword("");
    setNotice("Two-factor authentication has been disabled.");
    setStatus("disabled");
  }

  return (
    <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
      <Link href={backHref} className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600">
        <ArrowLeft size={14} /> Back to dashboard
      </Link>

      {notice && (
        <div className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</div>
      )}

      {status === "loading" && <p className="text-sm text-slate-400">Loading...</p>}

      {status === "disabled" && (
        <div>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <ShieldOff size={18} />
            </div>
            <div>
              <p className="font-black text-slate-900">Two-Factor Authentication</p>
              <p className="text-xs font-semibold text-slate-400">Currently disabled</p>
            </div>
          </div>
          <button
            type="button"
            onClick={startSetup}
            disabled={busy}
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-100 hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? "Starting..." : "Enable 2FA"}
          </button>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      )}

      {status === "setting_up" && qrCodeDataUrl && (
        <form onSubmit={confirmSetup}>
          <p className="mb-4 text-sm font-semibold text-slate-600">
            Scan this QR code with your authenticator app, then enter the 6-digit code it shows.
          </p>
          <div className="mb-4 flex justify-center rounded-2xl border border-slate-100 bg-slate-50 p-6">
            <Image src={qrCodeDataUrl} alt="2FA QR code" width={200} height={200} unoptimized />
          </div>
          {secret && (
            <p className="mb-4 break-all rounded-xl bg-slate-50 px-4 py-3 text-center text-xs font-mono text-slate-500">
              Can&apos;t scan? Enter manually: {secret}
            </p>
          )}
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="mb-3 w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-center text-2xl tracking-[0.5em] outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
          />
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy || code.length !== 6}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md shadow-blue-100 hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? "Verifying..." : "Confirm & Enable"}
          </button>
        </form>
      )}

      {status === "enabled" && (
        <div>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="font-black text-slate-900">Two-Factor Authentication</p>
              <p className="text-xs font-semibold text-emerald-600">Enabled</p>
            </div>
          </div>
          <form onSubmit={disable} className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Enter your password to disable 2FA
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-50"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={busy || !password}
              className="rounded-xl border border-red-200 bg-red-50 px-6 py-3 text-sm font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
            >
              {busy ? "Disabling..." : "Disable 2FA"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
