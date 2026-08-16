import { notFound } from "next/navigation";
import pool from "@/config/db";
import type { RowDataPacket } from "mysql2";
import ProductDetailView from "@/components/ProductDetailView";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const medicineId = Number(params.id);
  if (!Number.isInteger(medicineId)) notFound();

  const [[product]] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, category, description, image_url, selling_price_ks, stock_qty, reserved_qty
     FROM medicines WHERE id = :id AND is_active = 1`,
    { id: medicineId }
  );
  if (!product) notFound();

  const [reviews] = await pool.query<RowDataPacket[]>(
    `SELECT pr.id, pr.rating, pr.comment, pr.created_at, u.name AS reviewer_name
     FROM product_reviews pr JOIN users u ON u.id = pr.user_id
     WHERE pr.medicine_id = :id ORDER BY pr.created_at DESC`,
    { id: medicineId }
  );
  const [[summary]] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS count, COALESCE(AVG(rating), 0) AS average FROM product_reviews WHERE medicine_id = :id`,
    { id: medicineId }
  );

  return (
    <ProductDetailView
      product={{
        id: product.id,
        name: product.name,
        category: product.category,
        description: product.description,
        image_url: product.image_url,
        selling_price_ks: product.selling_price_ks,
        stock_qty: product.stock_qty,
        reserved_qty: product.reserved_qty,
      }}
      reviews={reviews as Array<{ id: number; rating: number; comment: string | null; created_at: string; reviewer_name: string }>}
      reviewCount={Number(summary.count)}
      averageRating={Number(summary.average)}
    />
  );
}
