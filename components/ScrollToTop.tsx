"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Ported behavior from Medical_Product/src/components/Layout/Layout.jsx,
 * which force-scrolled to top on every route change. Without this, the
 * browser's native back/forward scroll restoration can land you at a stale
 * pixel offset (often near the footer) once async-loaded sections like
 * HomeProductsSection/TestimonialsSection change the page's real height.
 */
export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}
