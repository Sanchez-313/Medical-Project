"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FaBars, FaXmark, FaChevronDown } from "react-icons/fa6";
import { IoSearch } from "react-icons/io5";
import { GoHeartFill } from "react-icons/go";
import { FaBagShopping } from "react-icons/fa6";
import { useCart } from "@/components/CartContext";
import { useLanguage } from "@/components/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";
import LogoutButton from "@/components/LogoutButton";

/**
 * Faithful port of Medical_Product/src/components/Navbar/Navbar.jsx.
 * Structure, copy, and Tailwind classes are kept as close to the original
 * as possible. What changed, deliberately:
 *  - localStorage authUser/authToken -> useSession() (NextAuth)
 *  - react-router NavLink/useNavigate -> next/link + usePathname/useRouter
 *  - Pharmacy dropdown links point at the real DB categories (Fever/Cough/
 *    Cold, Fitness & Supplement, Sexual Wellness, Mother & Child, Traditional
 *    Medicine, Personal Care & Equipment — see scripts/fullCatalog.js)
 *  - Cart/Wishlist icons now open the real CartPanel/WishlistPanel via
 *    CartContext, backed by /api/cart and /api/orders
 */
export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { cartCount, wishlistCount, openCart, openWishlist } = useCart();
  const { t } = useLanguage();

  const [searchTerm, setSearchTerm] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleMenu = () => setShowMenu((prev) => !prev);

  const linkClass = (href: string) =>
    pathname === href
      ? "text-blue-600 font-bold border-b-2 border-dotted border-blue-400 pb-1"
      : "text-zinc-800 hover:text-blue-500 transition-colors";

  function handleSearchSubmit(event: FormEvent) {
    event.preventDefault();
    if (!searchTerm.trim()) return;
    router.push(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
  }

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-white/95 backdrop-blur-md shadow-md py-4" : "bg-gray-100 py-6"
      }`}
    >
      <nav className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-4 sm:px-6 md:px-8 lg:px-10">
        {/* Logo */}
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-2 group -ml-10 md:-ml-14 bg-transparent"
        >
          <Image
            src="/images/logo.png"
            alt="AzureMed Hub Logo"
            width={48}
            height={48}
            className="w-12 h-12 object-contain group-hover:rotate-12 transition-transform"
          />
          <div className="flex flex-col leading-none">
            <div className="flex items-baseline gap-1 whitespace-nowrap">
              <span className="text-lg md:text-[1.35rem] font-bold tracking-tight text-indigo-400 uppercase italic">
                AzureMed
              </span>
              <span className="text-lg md:text-[1.35rem] font-bold tracking-tight text-blue-600 uppercase italic">
                hub
              </span>
            </div>
            <span className="text-[8px] font-bold text-blue-400 uppercase tracking-[0.18em]">
              Digital Pharmacy
            </span>
          </div>
        </button>

        {/* Nav links + action icons grouped into one right-aligned cluster —
            with only 2 top-level flex children (logo, this cluster) under
            nav's justify-between, spacing stays tight instead of the 3-way
            split spreading everything out across the full 1400px row. */}
        <div className="flex items-center gap-x-6 lg:gap-x-6">
        <ul className="hidden min-w-0 items-center gap-x-4 text-[12px] font-bold uppercase tracking-[0.12em] md:flex">
          <li>
            <Link href="/" className={`whitespace-nowrap ${linkClass("/")}`}>{t("nav.home")}</Link>
          </li>

          <li
            className="relative"
            onMouseEnter={() => setIsDropdownOpen(true)}
            onMouseLeave={() => setIsDropdownOpen(false)}
          >
            <button className="flex items-center gap-1 whitespace-nowrap text-zinc-800 hover:text-blue-500 transition-colors py-2 text-[12px]">
              {t("nav.pharmacy")} <FaChevronDown className={`text-[10px] transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {isDropdownOpen && (
              <div className="absolute top-full left-0 w-64 bg-white border border-zinc-100 shadow-2xl rounded-2xl py-4 flex flex-col z-[60]">
                <Link href="/products" className="px-6 py-3 hover:bg-blue-50 hover:text-blue-600 transition-colors">{t("nav.allProducts")}</Link>
                <Link href="/products?category=Fever%2C%20Cough%20%26%20Cold" className="px-6 py-3 hover:bg-blue-50 hover:text-blue-600 transition-colors">{t("nav.feverCoughCold")}</Link>
                <Link href="/products?category=Fitness%20%26%20Supplement" className="px-6 py-3 hover:bg-blue-50 hover:text-blue-600 transition-colors">{t("nav.fitnessSupplement")}</Link>
                <Link href="/products?category=Sexual%20Wellness" className="px-6 py-3 hover:bg-blue-50 hover:text-blue-600 transition-colors">{t("nav.sexualWellness")}</Link>
                <Link href="/products?category=Mother%20%26%20Child" className="px-6 py-3 hover:bg-blue-50 hover:text-blue-600 transition-colors">{t("nav.motherChild")}</Link>
                <Link href="/products?category=Traditional%20Medicine" className="px-6 py-3 hover:bg-blue-50 hover:text-blue-600 transition-colors">{t("nav.traditionalMedicine")}</Link>
                <Link href="/products?category=Personal%20Care%20%26%20Equipment" className="px-6 py-3 hover:bg-blue-50 hover:text-blue-600 transition-colors">{t("nav.personalCareEquipment")}</Link>
              </div>
            )}
          </li>

          <li>
            <Link href="/detect-medicine" className={`whitespace-nowrap ${linkClass("/detect-medicine")}`}>{t("nav.detectMedicine")}</Link>
          </li>

          {/* Consolidated "More" dropdown — Bills, About Us, Contact Us,
              Reviews. Keeping these off the top-level bar (instead of each
              as its own flat link) is what stops the header from packing
              tight / wrapping as more pages get added later. */}
          <li
            className="relative"
            onMouseEnter={() => setIsMoreOpen(true)}
            onMouseLeave={() => setIsMoreOpen(false)}
          >
            <button className="flex items-center gap-1 whitespace-nowrap text-zinc-800 hover:text-blue-500 transition-colors py-2 text-[12px]">
              {t("nav.more")} <FaChevronDown className={`text-[10px] transition-transform ${isMoreOpen ? "rotate-180" : ""}`} />
            </button>
            {isMoreOpen && (
              <div className="absolute top-full right-0 w-48 bg-white border border-zinc-100 shadow-2xl rounded-2xl py-4 flex flex-col z-[60]">
                <Link href="/orders" className="px-6 py-3 hover:bg-blue-50 hover:text-blue-600 transition-colors">{t("nav.bills")}</Link>
                <Link href="/about" className="px-6 py-3 hover:bg-blue-50 hover:text-blue-600 transition-colors">{t("nav.aboutUs")}</Link>
                <Link href="/contact" className="px-6 py-3 hover:bg-blue-50 hover:text-blue-600 transition-colors">{t("nav.contactUs")}</Link>
                <Link href="/#testimonials" className="px-6 py-3 hover:bg-blue-50 hover:text-blue-600 transition-colors">{t("nav.reviews")}</Link>
              </div>
            )}
          </li>

          <li>
            <LanguageToggle />
          </li>

          {session?.user ? (
            <>
              <li className="whitespace-nowrap text-[12px] text-zinc-700 normal-case tracking-normal px-3 py-2 rounded-lg shadow-xl bg-gray-300">
                {t("nav.hiUser")}, {session.user.name}
              </li>
              <li>
                <LogoutButton className="whitespace-nowrap bg-slate-700 !text-white border-0 px-4 py-2 rounded-full hover:bg-slate-800 hover:!text-white shadow-lg active:scale-95" />
              </li>
            </>
          ) : (
            <li>
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="flex items-center justify-center whitespace-nowrap rounded-full border-2 border-blue-600 px-4 py-2 text-blue-600 transition-all hover:bg-blue-50 active:scale-95"
                >
                  {t("nav.signIn")}
                </Link>
                <Link
                  href="/register"
                  className="flex items-center justify-center whitespace-nowrap rounded-full bg-blue-600 px-4 py-2 text-white transition-all shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95"
                >
                  {t("nav.signUp")}
                </Link>
              </div>
            </li>
          )}
        </ul>

        {/* Action icons */}
        <div className="flex items-center gap-x-3 md:gap-x-5">
          <form
            onSubmit={handleSearchSubmit}
            className="hidden lg:flex items-center bg-slate-200 rounded-full px-4 py-1.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all"
          >
            <IoSearch className="text-slate-400" />
            <input
              type="text"
              placeholder={t("nav.searchPlaceholder")}
              className="bg-transparent border-none focus:outline-none text-sm ml-2 w-32 xl:w-38"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
                className="ml-1 flex items-center justify-center rounded-full p-1 text-slate-400 hover:bg-slate-300/60 hover:text-slate-600"
              >
                <FaXmark className="text-xs" />
              </button>
            )}
          </form>

          <button onClick={openWishlist} className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-full transition-all relative">
            <GoHeartFill size={22} />
            <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {wishlistCount}
            </span>
          </button>

          <button onClick={openCart} className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all relative">
            <FaBagShopping size={20} />
            <span className="absolute top-1 right-1 bg-blue-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {cartCount}
            </span>
          </button>

          <button className="md:hidden text-3xl text-slate-800 z-[60]" onClick={toggleMenu}>
            {showMenu ? <FaXmark /> : <FaBars />}
          </button>
        </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`fixed inset-0 bg-slate-400/95 z-[50] md:hidden transition-all duration-500 ease-in-out ${
            showMenu ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
          }`}
        >
          <div className="flex flex-col items-center justify-center h-full gap-y-6 px-10">
            <Link href="/" onClick={toggleMenu} className="text-2xl font-bold text-slate-800">{t("nav.home")}</Link>
            <Link href="/products" onClick={toggleMenu} className="text-2xl font-bold text-slate-800">{t("nav.pharmacy")}</Link>
            <Link href="/orders" onClick={toggleMenu} className="text-2xl font-bold text-slate-800">{t("nav.bills")}</Link>
            <Link href="/detect-medicine" onClick={toggleMenu} className="text-2xl font-bold text-slate-800">{t("nav.detectMedicine")}</Link>
            <Link href="/about" onClick={toggleMenu} className="text-2xl font-bold text-slate-800">{t("nav.aboutUs")}</Link>
            <Link href="/contact" onClick={toggleMenu} className="text-2xl font-bold text-slate-800">{t("nav.contactUs")}</Link>
            <Link href="/#testimonials" onClick={toggleMenu} className="text-2xl font-bold text-slate-800">{t("nav.reviews")}</Link>

            <LanguageToggle />

            <div className="w-full h-[1px] bg-slate-100 my-2" />

            <form
              onSubmit={(e) => {
                handleSearchSubmit(e);
                toggleMenu();
              }}
              className="w-full max-w-xs flex items-center border-2 border-blue-500 rounded-full p-2 bg-slate-50"
            >
              <input
                type="text"
                placeholder={t("nav.searchPlaceholder")}
                className="flex-1 px-4 bg-transparent focus:outline-none text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                  className="mr-1 flex items-center justify-center rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                >
                  <FaXmark />
                </button>
              )}
              <button type="submit" className="bg-blue-500 text-white p-2 rounded-full">
                <IoSearch />
              </button>
            </form>

            {session?.user ? (
              <div className="flex flex-col w-full gap-4 mt-4">
                <div className="w-full text-center py-3 text-slate-800 font-bold">{t("nav.hiUser")}, {session.user.name}</div>
                <LogoutButton className="w-full !text-white py-4 bg-slate-700 border-0 rounded-2xl font-bold shadow-xl hover:bg-slate-800 hover:!text-white" />
              </div>
            ) : (
              <div className="mt-4 grid w-full grid-cols-2 gap-4">
                <Link
                  href="/login"
                  onClick={toggleMenu}
                  className="flex w-full items-center justify-center text-center py-4 border-2 border-blue-600 text-blue-600 rounded-2xl font-bold hover:bg-indigo-400 hover:text-white hover:shadow-2xl"
                >
                  {t("nav.signIn")}
                </Link>
                <Link
                  href="/register"
                  onClick={toggleMenu}
                  className="flex w-full items-center justify-center text-center py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl hover:bg-amber-100 hover:text-blue-600 hover:shadow-2xl"
                >
                  {t("nav.signUp")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
