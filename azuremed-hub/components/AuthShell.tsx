import Link from "next/link";
import type { ReactNode } from "react";

interface AuthShellProps {
  /** Which side the active form panel renders on — mirrors the report's flip-card layout (register: form left, login: form right). */
  formSide: "left" | "right";
  teaser: {
    eyebrow: string;
    title: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
  };
  children: ReactNode;
}

function SocialIcon({ label, path }: { label: string; path: string }) {
  return (
    <button
      type="button"
      disabled
      title={`${label} sign-in — coming soon`}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-muted text-slate-400 opacity-60"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
        <path d={path} />
      </svg>
    </button>
  );
}

export default function AuthShell({ formSide, teaser, children }: AuthShellProps) {
  const formPanel = (
    <div className="flex flex-col justify-center bg-white p-8 sm:p-10">{children}</div>
  );

  const teaserPanel = (
    <div className="flex flex-col justify-center gap-4 bg-gradient-to-br from-brand-dark to-brand p-8 text-white sm:p-10">
      <span className="text-xs font-semibold uppercase tracking-widest text-brand-lighter">
        {teaser.eyebrow}
      </span>
      <h2 className="text-3xl font-bold">{teaser.title}</h2>
      <p className="text-sm text-blue-100">{teaser.description}</p>
      <Link
        href={teaser.ctaHref}
        className="mt-4 inline-block w-fit rounded-full border border-white/70 px-6 py-2.5 text-sm font-semibold transition hover:bg-white hover:text-brand-dark"
      >
        {teaser.ctaLabel}
      </Link>
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-blue-50 px-4 py-12 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-4xl">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
            A
          </span>
          <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
            AzureMed <span className="text-brand">HUB</span>
          </span>
        </div>
        <div className="grid overflow-hidden rounded-2xl shadow-2xl md:grid-cols-2">
          {formSide === "left" ? (
            <>
              {formPanel}
              {teaserPanel}
            </>
          ) : (
            <>
              {teaserPanel}
              {formPanel}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function SocialRow() {
  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-brand-muted" />
        VERIFIED HEALTH LOGIN
        <span className="h-px flex-1 bg-brand-muted" />
      </div>
      <div className="mt-4 flex justify-center gap-3">
        <SocialIcon
          label="Google"
          path="M21.35 11.1h-9.17v2.87h5.27c-.23 1.4-1.62 4.1-5.27 4.1-3.17 0-5.76-2.62-5.76-5.85s2.6-5.85 5.76-5.85c1.8 0 3.01.77 3.7 1.43l2.52-2.43C16.87 3.7 14.72 2.7 12.18 2.7c-5.14 0-9.3 4.15-9.3 9.3s4.16 9.3 9.3 9.3c5.37 0 8.94-3.77 8.94-9.08 0-.61-.07-1.08-.16-1.52z"
        />
        <SocialIcon
          label="Facebook"
          path="M13.5 21v-7.5h2.5l.4-3h-2.9V8.5c0-.9.25-1.5 1.55-1.5H16.5V4.3C16.2 4.27 15.2 4.2 14 4.2c-2.4 0-4 1.46-4 4.14V10.5H7.5v3H10V21h3.5z"
        />
        <SocialIcon
          label="Telegram"
          path="M21.9 4.3 3.5 11.5c-1.2.5-1.2 1.2-.2 1.5l4.7 1.5 1.8 5.5c.2.6.4.8.9.8.4 0 .6-.2.9-.5l2.1-2 4.4 3.2c.8.5 1.4.2 1.6-.7l3-14c.3-1.2-.4-1.7-1.8-1.5z"
        />
      </div>
    </div>
  );
}
