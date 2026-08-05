import Link from "next/link";
import Image from "next/image";
import pool from "@/config/db";
import type { RowDataPacket } from "mysql2";
import HomeProductsSection from "@/components/HomeProductsSection";
import Heading from "@/components/Heading";
import ValuesSection from "@/components/ValuesSection";
import FAQSection from "@/components/FAQSection";
import TestimonialsSection from "@/components/TestimonialsSection";

const CATEGORY_ART: Record<string, string> = {
  "English Medicine": "/images/categories/english-medicine.png",
  "Myanmar Medicine": "/images/categories/myanmar-medicine.png",
  "Medical Equipment": "/images/categories/medical-equipment.png",
};

export default async function StorefrontHomePage() {
  const [categoryRows] = await pool.query<RowDataPacket[]>(
    `SELECT category, COUNT(*) AS product_count
     FROM medicines
     WHERE is_active = 1
     GROUP BY category
     ORDER BY category ASC`
  );

  const totalProducts = categoryRows.reduce((sum, row) => sum + Number(row.product_count), 0);

  return (
    <div>
      {/* Hero — ported from Medical_Product/src/components/Hero/Hero.jsx, redesigned per request
          into a more vibrant gradient treatment (fixed navbar needs the top offset). */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Decorative gradient blobs — purely visual, no layout impact */}
        <div className="pointer-events-none absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-blue-300/30 blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 -left-40 h-[380px] w-[380px] rounded-full bg-indigo-300/25 blur-3xl" />

        <div className="relative min-h-screen max-w-[1400px] mx-auto px-10 flex md:flex-row flex-col items-center pt-36 md:pt-28">
          <div className="flex-1">
            <span className="inline-flex items-center gap-2 bg-blue-100/80 text-blue-700 text-sm md:text-base px-5 py-2 rounded-full font-semibold shadow-sm ring-1 ring-blue-200">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              Trusted Healthcare Solutions
            </span>
            <h1 className="md:text-7xl/[1.05] text-5xl/[1.1] font-extrabold mt-6 tracking-tight text-zinc-900">
              Reliable{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Medical
              </span>{" "}
              &amp;{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Pharmacy
              </span>{" "}
              Inventory System
            </h1>
            <p className="text-zinc-600 md:text-lg text-md max-w-[530px] mt-5 mb-8">
              Streamline your healthcare management with our integrated system for
              English and Myanmar medicines, surgical equipment, and real-time
              stock tracking.
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <Link
                href="/products"
                className="bg-gradient-to-b from-blue-500 to-blue-600 text-white px-8 py-3.5 rounded-lg md:text-lg text-md hover:scale-105 hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-blue-200 inline-block font-semibold"
              >
                Browse Products
              </Link>
              <Link
                href="/detect-medicine"
                className="bg-white text-blue-700 px-8 py-3.5 rounded-lg md:text-lg text-md hover:scale-105 transition-all duration-300 shadow-md ring-1 ring-blue-200 inline-block font-semibold"
              >
                Try AI Detection
              </Link>
            </div>

            {/* Real stats pulled from the live catalog — not placeholder numbers */}
            <div className="flex flex-wrap gap-x-10 gap-y-4">
              <div>
                <p className="text-3xl font-extrabold text-zinc-900">{totalProducts}+</p>
                <p className="text-sm text-zinc-500 font-medium">Products in stock</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-zinc-900">{categoryRows.length}</p>
                <p className="text-sm text-zinc-500 font-medium">Product categories</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-zinc-900">24/7</p>
                <p className="text-sm text-zinc-500 font-medium">AI medicine detection</p>
              </div>
            </div>
          </div>

          <div className="flex-1 mt-10 md:mt-0 relative h-[320px] md:h-[420px] w-full">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-[70%] w-[70%] rounded-full bg-gradient-to-tr from-blue-200/60 to-indigo-200/60 blur-2xl" />
            </div>
            <Image
              src="/images/hero-medical-supplies.png"
              alt="Medical Inventory and Equipment"
              fill
              className="relative object-contain drop-shadow-2xl brightness-105 hover:scale-105 transition-transform duration-300"
              priority
            />
          </div>
        </div>
      </section>

      {/* Categories — ported from Medical_Product/src/components/Category/Category.jsx card style,
          linked to real DB categories instead of the old English/Myanmar/Equipment taxonomy */}
      <section className="max-w-[1400px] mx-auto px-10 py-16">
        <Heading highlight="Browse" heading="Medical Categories" />
        <div className="flex flex-wrap gap-10 mt-14">
          {categoryRows.map((row) => (
            <div key={row.category} className="flex-1 basis-[300px]">
              {CATEGORY_ART[row.category] && (
                <div className="relative -mb-10 z-10 h-[220px] w-full">
                  <Image
                    src={CATEGORY_ART[row.category]}
                    alt={row.category}
                    width={280}
                    height={200}
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 max-h-[200px] w-auto object-contain"
                  />
                </div>
              )}
              <div className="bg-zinc-100 pt-16 p-8 rounded-xl border border-zinc-200">
                <h3 className="text-zinc-800 text-2xl font-bold">{row.category}</h3>
                <p className="text-zinc-600 mt-3 mb-6">{row.product_count} products available</p>
                <Link
                  href={`/products?category=${encodeURIComponent(row.category)}`}
                  className="inline-block bg-gradient-to-b from-blue-500 to-blue-600 text-white px-8 py-3 rounded-lg md:text-lg text-md hover:scale-105 hover:from-blue-600 hover:to-blue-700 transition-all duration-300 cursor-pointer shadow-md"
                >
                  View Products
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ValuesSection />

      {/* Products — faithful port of Products.jsx/Cards.jsx (tabs + light-theme cards), shows 8 at a time */}
      <HomeProductsSection />

      <FAQSection />
      <TestimonialsSection />
    </div>
  );
}
