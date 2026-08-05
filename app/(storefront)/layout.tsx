import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/components/CartContext";
import CartPanel from "@/components/CartPanel";
import WishlistPanel from "@/components/WishlistPanel";
import CartToast from "@/components/CartToast";
import ScrollToTop from "@/components/ScrollToTop";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div>
        <ScrollToTop />
        <Navbar />
        {children}
        <Footer />
        <CartPanel />
        <WishlistPanel />
        <CartToast />
      </div>
    </CartProvider>
  );
}
