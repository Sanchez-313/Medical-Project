import React, { useEffect, useRef } from "react";
import { Outlet, useOutletContext } from "react-router-dom";
import Hero from "../Hero/Hero";
import Category from "../Category/Category";
import Values from "../Values/Values";
import Products from "../Products/Products";
import Discount from "../Discount/Discount";
import Process from "../Process/Process";
import Testimonials from "../Testimonials/Testimonials";
import FAQ from '../FAQsection/faq'
import GoogleCustomSearch from "../GoogleCustomSearch/GoogleCustomSearch";

const App = () => {
  const outletContext = useOutletContext() || {};
  const { searchTerm, addToCart } = outletContext;
  const productsRef = useRef(null);

  useEffect(() => {
    if (!searchTerm || !searchTerm.trim()) return;
    productsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [searchTerm]);

  return (
    <div className="relative">
      <main>
        <Hero />
        <Category />
        <Values />
        <GoogleCustomSearch />
        <div ref={productsRef}>
          <Products searchTerm={searchTerm} addToCart={addToCart} />
        </div>
        <Discount />
        <Process />
        <FAQ />
        <Testimonials />
      </main>

      {/* OVERLAY ROUTES (via App.jsx nested routes) */}
      <Outlet context={{ addToCart }} />
    </div>
  );
};

export default App;
