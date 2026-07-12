import pool from "@/config/db";
import type { RowDataPacket } from "mysql2";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const category = searchParams.category?.trim();

  const [products] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, category, description, selling_price_ks, stock_qty, status
     FROM medicines
     WHERE is_active = 1
       AND (:category IS NULL OR category = :category)
     ORDER BY name ASC`,
    { category: category || null }
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-16 sm:px-10">
      <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
        {category ?? "All Products"}
      </h1>
      <p className="mt-2 text-sm text-slate-500">{products.length} products found</p>

      {products.length === 0 ? (
        <p className="mt-10 text-slate-500">No products in this category yet.</p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="rounded-xl border border-brand-muted bg-white p-5 shadow-sm dark:bg-slate-900"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-brand">
                {product.category}
              </span>
              <h3 className="mt-1 text-lg font-semibold text-slate-800 dark:text-slate-100">
                {product.name}
              </h3>
              {product.description && (
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{product.description}</p>
              )}
              <div className="mt-3 flex items-center justify-between">
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {Number(product.selling_price_ks).toLocaleString()} Ks
                </p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    product.status === "low"
                      ? "bg-amber-100 text-amber-700"
                      : product.stock_qty > 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {product.stock_qty > 0 ? `${product.stock_qty} in stock` : "Out of stock"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
