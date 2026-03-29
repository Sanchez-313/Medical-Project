import React, { useEffect, useState } from "react";
import Heading from "../Heading/Heading";
import Cards from "../Cards/Cards";
import { Link } from "react-router-dom";
import { requestJson } from "../../lib/api";
import { fallbackCatalogProducts, mapApiProduct } from "../../lib/productCatalog";

const Products = ({ addToCart, searchTerm = "" }) => {
  const categories = ["All", "EnglishMedicine", "MyanmarMedicine", "Equipment"];
  const [activeTab, setActivetab] = useState("All");
  const [products, setProducts] = useState(fallbackCatalogProducts);
  const normalizedSearch = searchTerm.trim().toLowerCase();

  useEffect(() => {
    let mounted = true;
    const loadProducts = async () => {
      try {
        const payload = await requestJson("/api/products?limit=200");
        const nextProducts = (payload?.data?.products || []).map(mapApiProduct);
        if (mounted) {
          setProducts(nextProducts.length > 0 ? nextProducts : fallbackCatalogProducts);
        }
      } catch {
        if (mounted) {
          setProducts(fallbackCatalogProducts);
        }
      }
    };

    loadProducts();
    return () => {
      mounted = false;
    };
  }, []);

  let filteredItems =
    activeTab === "All"
      ? products
      : products.filter((item) => item.category === activeTab);

  if (normalizedSearch) {
    filteredItems = filteredItems.filter((item) =>
      item.name.toLowerCase().includes(normalizedSearch) ||
      item.category.toLowerCase().includes(normalizedSearch)
    );
  }

  const visibleItems = normalizedSearch ? filteredItems : filteredItems.slice(0, 8);

  const renderCards = visibleItems.map((product) => {
    return (
      <Cards
        key={product.id}
        id={product.id}
        image={product.image}
        name={product.name}
        price={product.price}
        category={product.categoryLabel || product.category}
        stock={product.stock}
        description={product.description}
        onAddToCart={addToCart}
      />
    );
  });

  return (
    <section>
      <div className="max-w-[1400px] mx-auto px-10 py-2o">
        <Heading highlight="Our" heading="Products" />

        {/* Tabs */}
        <div className="flex flex-wrap gap-3 justify-center mt-10">
          {categories.map((category) => {
            return (
              <button
                key={category}
                className={`px-5 py-2 text-lg rounded-lg cursor-pointer
                ${activeTab === category ? "bg-gradient-to-b from-indigo-400 to-indigo-600 text-white" : "bg-zinc-100"}`}
                onClick={() => setActivetab(category)}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Listing */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-9 ml-12 mr-12 mt-20">
        {renderCards}
      </div>

      {normalizedSearch && visibleItems.length === 0 ? (
        <p className="mx-12 mt-8 text-center text-slate-500">
          No products found for "{searchTerm}".
        </p>
      ) : null}

      <div className="my-15 mx-auto w-fit">
        <Link
          to="/allproducts"
          className="bg-gradient-to-b from-indigo-400 to-indigo-500 text-white px-8 py-3 rounded-lg md:text-lg text-md hover:scale-110 hover:bg-gradient-to-l hover:to-indigo-600 transition-all duration-300 cursor-pointer"
        >
          View All
        </Link>
      </div>
    </section>
  );
};

export default Products;
