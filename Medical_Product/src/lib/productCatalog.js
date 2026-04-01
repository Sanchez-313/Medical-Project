import fallbackProducts from "../components/ProductList/ProductList";

const normalizeName = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

const fallbackById = new Map(
  fallbackProducts.map((product) => [String(product.id), product]),
);

const fallbackByName = new Map(
  fallbackProducts.map((product) => [normalizeName(product.name), product]),
);

const categoryMap = {
  EnglishMedicine: "English Medicine",
  MyanmarMedicine: "Myanmar Medicine",
  Equipment: "Medical Equipment",
};

export const fallbackCatalogProducts = fallbackProducts.map((product) => ({
  ...product,
  categoryLabel: categoryMap[String(product?.category)] || String(product?.category || "General"),
})).sort((a, b) => {
  const stockA = Number.isFinite(Number(a?.stock)) ? Number(a.stock) : Number.MAX_SAFE_INTEGER;
  const stockB = Number.isFinite(Number(b?.stock)) ? Number(b.stock) : Number.MAX_SAFE_INTEGER;
  return stockA - stockB || Number(a?.id || 0) - Number(b?.id || 0);
});

export function mapApiProduct(product) {
  const resolvedId = Number(product?.id ?? product?.product_id);
  const fallback =
    fallbackById.get(String(resolvedId)) ||
    fallbackByName.get(normalizeName(product?.name));

  return {
    id: Number.isInteger(resolvedId) ? resolvedId : null,
    name: String(product?.name || fallback?.name || "Product"),
    slug: String(product?.slug || ""),
    price: Number(product?.price_ks ?? fallback?.price ?? 0),
    category: String(product?.category || fallback?.category || "General"),
    categoryLabel:
      categoryMap[String(product?.category || fallback?.category)] ||
      String(product?.category || fallback?.category || "General"),
    image: product?.image_url || fallback?.image || null,
    stock: Number.isFinite(Number(product?.stock))
      ? Number(product.stock)
      : Number.isFinite(Number(fallback?.stock))
        ? Number(fallback.stock)
        : null,
    description:
      String(product?.description || "").trim() || fallback?.description || "",
    expiryDate: String(
      product?.expiry_date ||
      product?.expiryDate ||
      product?.exp_date ||
      fallback?.expiryDate ||
      "",
    ),
    createdAt: String(product?.created_at || fallback?.createdAt || ""),
    updatedAt: String(product?.updated_at || fallback?.updatedAt || ""),
  };
}
