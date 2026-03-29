import fallbackProducts from "../components/ProductList/ProductList";

const normalizeName = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
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
}));

export function mapApiProduct(product) {
  const fallback =
    fallbackById.get(String(product?.id)) ||
    fallbackByName.get(normalizeName(product?.name));

  return {
    id: Number(product?.id),
    name: String(product?.name || fallback?.name || "Product"),
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
  };
}
