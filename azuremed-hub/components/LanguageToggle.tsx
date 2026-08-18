"use client";

import { useLanguage } from "@/components/LanguageContext";

export default function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLanguage();

  return (
    <div className={`flex items-center rounded-full bg-slate-100 p-1 text-xs font-bold ${className}`}>
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={`rounded-full px-3 py-1.5 transition-all ${
          lang === "en" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("my")}
        aria-pressed={lang === "my"}
        className={`rounded-full px-3 py-1.5 transition-all ${
          lang === "my" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
        }`}
      >
        မြန်မာ
      </button>
    </div>
  );
}
