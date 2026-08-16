import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/components/CartContext";
import { LanguageProvider } from "@/components/LanguageContext";
import CartPanel from "@/components/CartPanel";
import WishlistPanel from "@/components/WishlistPanel";
import CartToast from "@/components/CartToast";
import ScrollToTop from "@/components/ScrollToTop";
import NeedHelpButton from "@/components/NeedHelpButton";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <CartProvider>
        <div>
          <ScrollToTop />
          <Navbar />
          {children}
          <Footer />
          <CartPanel />
          <WishlistPanel />
          <CartToast />
          <NeedHelpButton />
        </div>
      </CartProvider>
    </LanguageProvider>
  );
}
