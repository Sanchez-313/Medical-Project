import Image from "next/image";
import pool from "@/config/db";
import type { RowDataPacket } from "mysql2";
import ProductCard from "@/components/ProductCard";

const BANNER_ART: Record<string, string> = {
  "English Medicine": "/images/Engmedicines/Hero.png",
  "Myanmar Medicine": "/images/categories/myanmar-medicine.png",
  "Medical Equipment": "/images/categories/medical-equipment.png",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string };
}) {
  const category = searchParams.category?.trim();
  const search = searchParams.search?.trim();
  const title = category ?? "All Products";
  const banner = category ? BANNER_ART[category] : "/images/hero-medical-supplies.png";

  const [products] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, category, description, image_url, selling_price_ks, stock_qty, status
     FROM medicines
     WHERE is_active = 1
       AND (:category IS NULL OR category = :category)
       AND (:search IS NULL OR name LIKE CONCAT('%', :search, '%'))
     ORDER BY name ASC`,
    { category: category || null, search: search || null }
  );

  return (
    <div className="pt-32">
      {/* Category banner — redesigned to match the gradient hero treatment */}
      <div className="relative h-64 w-full overflow-hidden">
        {banner && <Image src={banner} alt={title} fill className="object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-blue-800/60 to-indigo-900/80" />
        <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="relative flex h-full flex-col items-center justify-center gap-3 text-center px-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-50 ring-1 ring-white/30 backdrop-blur-sm">
            AzureMed Hub Catalog
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white drop-shadow-sm">{title}</h1>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-10 py-10">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-blue-100 px-4 py-1.5 text-sm font-bold text-blue-700">
            {products.length} products found
          </span>
        </div>

        {products.length === 0 ? (
          <p className="mt-10 text-slate-500">No products in this category yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-9 mt-10">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id,
                  name: product.name,
                  category: product.category,
                  image_url: product.image_url,
                  selling_price_ks: product.selling_price_ks,
                  stock_qty: product.stock_qty,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
