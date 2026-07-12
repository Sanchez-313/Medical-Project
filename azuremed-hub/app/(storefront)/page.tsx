import Link from "next/link";
import Image from "next/image";
import pool from "@/config/db";
import type { RowDataPacket } from "mysql2";

const CATEGORY_ART: Record<string, string> = {
  Vitamins: "/images/categories/english-medicine.png",
  Topical: "/images/categories/myanmar-medicine.png",
  "First Aid": "/images/categories/medical-equipment.png",
};

export default async function StorefrontHomePage() {
  const [categoryRows] = await pool.query<RowDataPacket[]>(
    `SELECT category, COUNT(*) AS product_count
     FROM medicines
     WHERE is_active = 1
     GROUP BY category
     ORDER BY category ASC`
  );

  const [productRows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, category, selling_price_ks, stock_qty, status
     FROM medicines
     WHERE is_active = 1
     ORDER BY name ASC
     LIMIT 8`
  );

  return (
    <div>
      {/* Hero — matches report Figure 6.2 */}
      <section className="bg-gradient-to-b from-blue-50 to-white px-6 py-16 dark:from-slate-900 dark:to-slate-950 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <span className="inline-block rounded-full bg-brand/10 px-4 py-1 text-xs font-semibold text-brand">
            Trusted Healthcare Solutions
          </span>
          <h1 className="mt-4 max-w-2xl text-4xl font-extrabold leading-tight text-slate-800 dark:text-slate-100 sm:text-5xl">
            Reliable <span className="text-brand">Medical</span> &amp;{" "}
            <span className="text-brand">Pharmacy</span> Inventory System
          </h1>
          <p className="mt-4 max-w-xl text-slate-600 dark:text-slate-400">
            Streamline your healthcare management with our integrated system for
            English and Myanmar medicines, surgical equipment, and real-time stock
            tracking.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-block rounded-full bg-brand px-8 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            Browse Products
          </Link>
        </div>
      </section>

      {/* Categories — derived live from the DB so every link actually resolves to real stock */}
      <section className="mx-auto max-w-5xl px-6 py-16 sm:px-10">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Browse Medical Categories
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {categoryRows.map((row) => (
            <Link
              key={row.category}
              href={`/products?category=${encodeURIComponent(row.category)}`}
              className="group rounded-xl border border-brand-muted bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:bg-slate-900"
            >
              {CATEGORY_ART[row.category] && (
                <div className="relative mb-4 h-32 w-full">
                  <Image
                    src={CATEGORY_ART[row.category]}
                    alt={row.category}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{row.category}</h3>
              <p className="mt-1 text-sm text-slate-500">{row.product_count} products available</p>
              <span className="mt-4 inline-block text-sm font-semibold text-brand group-hover:underline">
                View Products &rarr;
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Live product grid */}
      <section className="mx-auto max-w-5xl px-6 pb-20 sm:px-10">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Available Medicines</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {productRows.map((product) => (
            <div
              key={product.id}
              className="rounded-xl border border-brand-muted bg-white p-4 shadow-sm dark:bg-slate-900"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-brand">
                {product.category}
              </span>
              <h3 className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{product.name}</h3>
              <p className="mt-2 text-lg font-bold text-slate-800 dark:text-slate-100">
                {Number(product.selling_price_ks).toLocaleString()} Ks
              </p>
              <p className={`mt-1 text-xs font-medium ${product.status === "low" ? "text-amber-600" : "text-emerald-600"}`}>
                {product.stock_qty > 0 ? `${product.stock_qty} in stock` : "Out of stock"}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
