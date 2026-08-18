import pool from "@/config/db";
import type { RowDataPacket } from "mysql2";
import HomeHero from "@/components/HomeHero";
import AdvertisementSlideshow from "@/components/AdvertisementSlideshow";
import CategoriesSection from "@/components/CategoriesSection";
import HomeProductsSection from "@/components/HomeProductsSection";
import ValuesSection from "@/components/ValuesSection";
import FAQSection from "@/components/FAQSection";
import TestimonialsSection from "@/components/TestimonialsSection";

// No auth/session call here for Next to detect as a "dynamic API", so it
// gets silently build-time prerendered otherwise — which tries to connect
// to the DB at build time and fails on hosts (Vercel) that can't reach it.
export const dynamic = "force-dynamic";

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
      <HomeHero totalProducts={totalProducts} categoryCount={categoryRows.length} />

      <AdvertisementSlideshow />

      <CategoriesSection categoryRows={categoryRows as Array<{ category: string; product_count: number }>} />

      <ValuesSection />

      {/* Products — faithful port of Products.jsx/Cards.jsx (tabs + light-theme cards), shows 8 at a time */}
      <HomeProductsSection />

      <FAQSection />
      <TestimonialsSection />
    </div>
  );
}
