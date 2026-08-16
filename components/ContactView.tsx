"use client";

import Link from "next/link";
import { Phone, Mail, MapPin, Clock, MessageSquare } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import type { TranslationKey } from "@/lib/translations";

const CONTACT_CARDS: Array<{ icon: typeof Phone; labelKey: TranslationKey; value: string; valueKey?: TranslationKey }> = [
  { icon: Phone, labelKey: "contact.phone", value: "+95 9 979 111 501" },
  { icon: Mail, labelKey: "contact.email", value: "dravenkai2@gmail.com" },
  { icon: MapPin, labelKey: "contact.address", value: "Mandalay, Myanmar" },
  { icon: Clock, labelKey: "contact.hours", value: "", valueKey: "contact.hoursValue" },
];

export default function ContactView({ isSignedIn }: { isSignedIn: boolean }) {
  const { t } = useLanguage();

  return (
    <div className="pt-32 pb-20">
      <section className="max-w-[1400px] mx-auto px-10 text-center">
        <span className="inline-block rounded-full bg-blue-100 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-600">
          {t("contact.badge")}
        </span>
        <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900">
          {t("contact.heading")}
        </h1>
        <p className="mt-4 mx-auto max-w-xl text-zinc-600 md:text-lg">{t("contact.description")}</p>
      </section>

      <section className="max-w-[1400px] mx-auto px-10 mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {CONTACT_CARDS.map(({ icon: Icon, labelKey, value, valueKey }) => (
          <div key={labelKey} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Icon size={20} />
            </span>
            <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400">{t(labelKey)}</p>
            <p className="mt-1 font-semibold text-zinc-800">{valueKey ? t(valueKey) : value}</p>
          </div>
        ))}
      </section>

      <section className="max-w-2xl mx-auto px-10 mt-16 text-center">
        <div className="rounded-3xl border border-blue-100 bg-blue-50/50 p-10">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg">
            <MessageSquare size={22} />
          </span>
          <h2 className="mt-4 text-xl font-bold text-zinc-900">{t("contact.specificQuestion")}</h2>
          <p className="mt-2 text-sm text-zinc-600">{t("contact.signInPrompt")}</p>
          <Link
            href={isSignedIn ? "/support" : "/login"}
            className="mt-6 inline-block rounded-full bg-blue-600 px-8 py-3 font-semibold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-105 transition-all"
          >
            {isSignedIn ? t("contact.goToSupport") : t("contact.signInToContact")}
          </Link>
        </div>
      </section>
    </div>
  );
}
