"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export interface CartItem {
  id: number; // cart_items.id
  medicineId: number;
  name: string;
  category: string;
  image_url: string | null;
  price: number;
  quantity: number;
  stock_qty: number;
}

export interface WishlistItem {
  id: number; // medicine id
  name: string;
  category: string;
  image_url: string | null;
  price: number;
  quantity: number;
}

interface CartContextValue {
  cartItems: CartItem[];
  cartCount: number;
  wishlistItems: WishlistItem[];
  wishlistCount: number;
  activePanel: "cart" | "wishlist" | null;
  toast: string | null;
  openCart: () => void;
  openWishlist: () => void;
  closePanel: () => void;
  addToCart: (product: { id: number; name: string; category: string; image_url: string | null; price: number }, qty?: number) => Promise<void>;
  updateCartQty: (medicineId: number, qty: number) => Promise<void>;
  removeFromCart: (medicineId: number) => Promise<void>;
  toggleFavorite: (product: { id: number; name: string; category: string; image_url: string | null; price: number }) => void;
  isFavorite: (id: number) => boolean;
  removeFromWishlist: (id: number) => void;
  clearWishlist: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function wishlistKey(userId: string) {
  return `azuremed:wishlist:${userId}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const router = useRouter();
  const userId = session?.user?.id;

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [activePanel, setActivePanel] = useState<"cart" | "wishlist" | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 1800);
  }, []);

  const refreshCart = useCallback(async () => {
    if (!userId) {
      setCartItems([]);
      return;
    }
    const result = await fetch("/api/cart").then((r) => r.json());
    if (result.success) setCartItems(result.data.items);
  }, [userId]);

  useEffect(() => {
    refreshCart();
    if (userId) {
      const raw = localStorage.getItem(wishlistKey(userId));
      setWishlistItems(raw ? JSON.parse(raw) : []);
    } else {
      setWishlistItems([]);
    }
  }, [userId, refreshCart]);

  useEffect(() => {
    if (userId) localStorage.setItem(wishlistKey(userId), JSON.stringify(wishlistItems));
  }, [wishlistItems, userId]);

  const addToCart = useCallback(
    async (product: { id: number; name: string; category: string; image_url: string | null; price: number }, qty = 1) => {
      if (!userId) {
        router.push("/login");
        return;
      }
      const result = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id, qty }),
      }).then((r) => r.json());

      if (!result.success) {
        showToast(result.message ?? "Could not add to cart");
        return;
      }
      showToast("Item added to cart");
      await refreshCart();
    },
    [userId, router, refreshCart, showToast]
  );

  const updateCartQty = useCallback(
    async (medicineId: number, qty: number) => {
      if (qty <= 0) {
        await fetch(`/api/cart/items/${medicineId}`, { method: "DELETE" });
      } else {
        await fetch(`/api/cart/items/${medicineId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qty }),
        });
      }
      await refreshCart();
    },
    [refreshCart]
  );

  const removeFromCart = useCallback(
    async (medicineId: number) => {
      await fetch(`/api/cart/items/${medicineId}`, { method: "DELETE" });
      await refreshCart();
    },
    [refreshCart]
  );

  const isFavorite = useCallback((id: number) => wishlistItems.some((item) => item.id === id), [wishlistItems]);

  const toggleFavorite = useCallback(
    (product: { id: number; name: string; category: string; image_url: string | null; price: number }) => {
      if (!userId) {
        router.push("/login");
        return;
      }
      setWishlistItems((prev) => {
        const exists = prev.some((item) => item.id === product.id);
        if (exists) {
          showToast("Removed from favorites");
          return prev.filter((item) => item.id !== product.id);
        }
        showToast("Added to favorites");
        return [...prev, { ...product, quantity: 1 }];
      });
    },
    [userId, router, showToast]
  );

  const removeFromWishlist = useCallback((id: number) => {
    setWishlistItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearWishlist = useCallback(() => setWishlistItems([]), []);

  const value: CartContextValue = {
    cartItems,
    cartCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    wishlistItems,
    wishlistCount: wishlistItems.length,
    activePanel,
    toast,
    openCart: () => setActivePanel("cart"),
    openWishlist: () => setActivePanel("wishlist"),
    closePanel: () => setActivePanel(null),
    addToCart,
    updateCartQty,
    removeFromCart,
    toggleFavorite,
    isFavorite,
    removeFromWishlist,
    clearWishlist,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
