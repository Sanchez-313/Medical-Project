"use client";

import Link from "next/link";
import Image from "next/image";
import { IoIosArrowForward } from "react-icons/io";
import { useLanguage } from "@/components/LanguageContext";

/** Ported from Medical_Product/src/components/Footer/Footer.jsx, compacted (the
 *  original's `h-[5vh]` newsletter input and py-10/gap-y-12/text-2xl spacing
 *  made this section render unusually tall on some viewports). */
export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  return (
    <footer className="bg-zinc-100 py-6">
      <div className="flex flex-wrap gap-y-8 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex-1 basis-[300px]">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/images/logo.png"
              alt="AzureMed Hub Logo"
              width={40}
              height={40}
              className="w-10 h-10 object-contain hover:rotate-12 transition-transform"
            />
            <div className="flex flex-col leading-none">
              <span className="text-lg font-bold tracking-tighter text-indigo-400 uppercase italic">
                AzureMed<span className="text-blue-600"> hub</span>
              </span>
              <span className="text-[9px] font-bold text-blue-400 uppercase tracking-[0.2em]">
                Digital Pharmacy
              </span>
            </div>
          </Link>

          <p className="text-sm text-zinc-600 mt-3 max-w-[350px]">{t("footer.tagline")}</p>

          <p className="text-xs text-zinc-800 mt-3">{currentYear} &copy; {t("footer.rightsReserved")}</p>
        </div>

        <ul className="flex-1">
          <li>
            <h5 className="text-zinc-800 text-base font-bold">{t("footer.company")}</h5>
          </li>
          <li className="mt-3">
            <Link href="/about" className="text-sm text-zinc-800 hover:text-indigo-500">{t("footer.about")}</Link>
          </li>
          <li className="mt-2">
            <Link href="/#faq" className="text-sm text-zinc-800 hover:text-indigo-500">{t("footer.faq")}</Link>
          </li>
        </ul>

        <ul className="flex-1">
          <li>
            <h5 className="text-zinc-800 text-base font-bold">{t("footer.support")}</h5>
          </li>
          <li className="mt-3">
            <Link href="/support" className="text-sm text-zinc-800 hover:text-indigo-500">{t("footer.supportCenter")}</Link>
          </li>
          <li className="mt-2">
            <Link href="/contact" className="text-sm text-zinc-800 hover:text-indigo-500">{t("footer.feedback")}</Link>
          </li>
        </ul>

        <div className="flex-1">
          <h5 className="text-zinc-800 text-base font-bold">{t("footer.stayConnected")}</h5>
          <p className="mt-3 text-sm text-zinc-600">{t("footer.feedbackPrompt")}</p>
          <div className="flex bg-white p-1 rounded-lg mt-3">
            <input
              type="email"
              placeholder={t("footer.emailPlaceholder")}
              className="h-9 pl-4 flex-1 text-sm focus:outline-none"
            />
            <button className="bg-gradient-to-b from-indigo-400 to-indigo-600 p-2 rounded-lg text-white hover:to-amber-600 cursor-pointer">
              <IoIosArrowForward />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
