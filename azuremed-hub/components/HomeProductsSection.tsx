"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import Heading from "@/components/Heading";

interface Product {
  id: number;
  name: string;
  category: string;
  image_url: string | null;
  selling_price_ks: number;
  stock_qty: number;
}

const CATEGORIES = [
  "All",
  "Fever, Cough & Cold",
  "Fitness & Supplement",
  "Sexual Wellness",
  "Mother & Child",
  "Traditional Medicine",
  "Personal Care & Equipment",
];

/** Faithful port of Medical_Product/src/components/Products/Products.jsx + Heading.jsx (light theme). */
export default function HomeProductsSection() {
  const [activeTab, setActiveTab] = useState("All");
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((result) => result.success && setProducts(result.data));
  }, []);

  const filtered = activeTab === "All" ? products : products.filter((p) => p.category === activeTab);
  const visible = filtered.slice(0, 8);

  return (
    <section>
      <div className="max-w-[1400px] mx-auto px-10 py-10">
        <Heading highlight="Our" heading="Products" />

        <div className="flex flex-wrap gap-3 justify-center mt-10">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              className={`px-5 py-2 text-lg rounded-lg cursor-pointer ${
                activeTab === category ? "bg-gradient-to-b from-indigo-400 to-indigo-600 text-white" : "bg-zinc-100"
              }`}
              onClick={() => setActiveTab(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-9 ml-12 mr-12 mt-auto">
        {visible.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {visible.length === 0 && (
        <p className="mx-12 mt-8 text-center text-slate-500">No products found in this category.</p>
      )}

      <div className="py-10 my-16 mx-auto w-fit mt-0">
        <Link
          href="/products"
          className="bg-gradient-to-b from-indigo-400 to-indigo-500 text-white px-8 py-3 rounded-lg md:text-lg text-md hover:scale-110 hover:bg-gradient-to-l hover:to-indigo-600 transition-all duration-300 cursor-pointer inline-block"
        >
          View All
        </Link>
      </div>
    </section>
  );
}
