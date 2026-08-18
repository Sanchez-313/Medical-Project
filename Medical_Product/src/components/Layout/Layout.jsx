import React, { useEffect, useRef, useState } from "react";
import { Navbar } from "../Navbar/Navbar";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Footer from "../Footer/Footer";
import Cart from "../Cart/Cart";
import Wishlist from "../Wishlist.jsx/Wishlist";
import { IoIosArrowUp } from "react-icons/io";
import { authRequestJson, requestJson } from "../../lib/api";
import { mapApiProduct } from "../../lib/productCatalog";

const STORAGE_PREFIX = "azuremed";
const CART_HOLD_MINUTES = 10;

const parseAuthUser = () => {
  try {
    const raw = localStorage.getItem("authUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getAuthIdentity = () => {
  const token = localStorage.getItem("authToken");
  const user = parseAuthUser();
  if (!token) return null;
  return user?.id || user?.email || user?.name || "session";
};

const getStorageKey = (type, identity) =>
  `${STORAGE_PREFIX}:${type}:${identity}`;

const readStoredItems = (type, identity) => {
  if (!identity) return [];
  try {
    const raw = localStorage.getItem(getStorageKey(type, identity));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeStoredItems = (type, identity, items) => {
  if (!identity) return;
  localStorage.setItem(getStorageKey(type, identity), JSON.stringify(items));
};

const clearExpiredSession = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
  window.dispatchEvent(new Event("auth-changed"));
};

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [authIdentity, setAuthIdentity] = useState(() => getAuthIdentity());
  const [didHydrateSavedState, setDidHydrateSavedState] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [stockById, setStockById] = useState({});
  const [stockConnectionReady, setStockConnectionReady] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [showBackToHome, setShowBackToHome] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState({
    open: false,
    title: "Log in to continue",
    message: "Please sign in first.",
  });
  const toastTimerRef = useRef(null);

  const normalizeId = (id) => String(id);
  const isKnownStock = (value) => Number.isFinite(Number(value));
  const isAuthenticated = () => Boolean(authIdentity);

  const triggerToast = (message) => {
    if (!message) return;
    setToastMessage(message);
    setShowToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setShowToast(false);
    }, 1800);
  };

  const loadStock = async () => {
    try {
      const payload = await requestJson("/api/products?limit=200");
      const products = payload?.data?.products || [];
      const next = {};
      for (const product of products) {
        const id = Number(product?.id);
        const stock = Number(product?.stock);
        if (Number.isInteger(id) && Number.isFinite(stock)) {
          next[normalizeId(id)] = Math.max(0, stock);
        }
      }
      setStockById(next);
      setStockConnectionReady(true);
      return next;
    } catch {
      setStockConnectionReady(false);
      return null;
    }
  };

  const getDatabaseStock = (id) => {
    const value = stockById[normalizeId(id)];
    return isKnownStock(value) ? Number(value) : null;
  };

  const getProductStock = (id) => {
    return getDatabaseStock(id);
  };

  const syncBackendCart = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setCartItems([]);
      return [];
    }

    try {
      const payload = await authRequestJson("/api/cart", { token });
      const nextItems = (payload?.data?.items || []).map((item) => ({
        ...mapApiProduct(item),
        quantity: Math.max(1, Number(item?.qty) || 1),
      }));
      setCartItems(nextItems);
      return nextItems;
    } catch (error) {
      if (
        error?.status === 401 ||
        String(error?.message || "").toLowerCase() === "unauthorized"
      ) {
        clearExpiredSession();
      }
      return [];
    }
  };

  const handlePanel = (tabName) => {
    if (tabName === "wishlist" && !isAuthenticated()) {
      setLoginPrompt({
        open: true,
        title: "Log in to view favorites",
        message: "Please sign in first to view and manage your favorite items.",
      });
      return;
    }
    setActivePanel((prev) => (prev === tabName ? null : tabName));
  };

  const handleClose = () => setActivePanel(null);
  const openCart = () => setActivePanel("cart");
  const openWishlist = () => handlePanel("wishlist");

  const openLoginPrompt = ({
    title = "Log in to continue",
    message = "Please sign in first.",
  } = {}) =>
    setLoginPrompt({
      open: true,
      title,
      message,
    });

  const closeLoginPrompt = () =>
    setLoginPrompt((prev) => ({
      ...prev,
      open: false,
    }));

  const goToSignIn = () => {
    closeLoginPrompt();
    navigate("/signin");
  };

  const ensureAuthenticated = (options) => {
    if (isAuthenticated()) return true;
    openLoginPrompt(options);
    return false;
  };

  const addToCart = async (product, quantity = 1) => {
    if (!product) return null;
    if (
      !ensureAuthenticated({
        title: "Log in to buy",
        message:
          "Please sign in first to add items to your cart and continue checkout.",
      })
    ) {
      return null;
    }

    const safeQty = Math.max(1, Number(quantity) || 1);
    const available = getProductStock(product.id);
    const qtyToAdd =
      available === null ? safeQty : Math.max(0, Math.min(safeQty, available));

    if (qtyToAdd <= 0) {
      triggerToast("Out of stock");
      return 0;
    }

    const previousItems = cartItems;
    setCartItems((prev) => {
      const existing = prev.find(
        (item) => normalizeId(item.id) === normalizeId(product.id),
      );
      if (existing) {
        return prev.map((item) =>
          normalizeId(item.id) === normalizeId(product.id)
            ? { ...item, quantity: item.quantity + qtyToAdd }
            : item,
        );
      }
      return [...prev, { ...product, quantity: qtyToAdd }];
    });

    if (qtyToAdd < safeQty) {
      triggerToast(`Only ${qtyToAdd} item(s) added due to stock`);
    } else {
      triggerToast(
        qtyToAdd > 1
          ? `${qtyToAdd} item(s) added to cart`
          : "Item added to cart",
      );
    }

    const token = localStorage.getItem("authToken");
    if (!token) return qtyToAdd;

    try {
      await authRequestJson("/api/cart/items", {
        method: "POST",
        token,
        body: {
          product_id: Number(product.id),
          qty: qtyToAdd,
        },
      });
      await Promise.all([loadStock(), syncBackendCart()]);
    } catch (error) {
      setCartItems(previousItems);
      if (
        error?.status === 401 ||
        String(error?.message || "").toLowerCase() === "unauthorized"
      ) {
        clearExpiredSession();
        return 0;
      }
      triggerToast(error?.message || "Could not add item to cart");
    }

    return qtyToAdd;
  };

  const isFavorite = (id) =>
    wishlistItems.some((item) => String(item.id) === String(id));

  const toggleFavorite = (product) => {
    if (!product) return null;
    if (
      !ensureAuthenticated({
        title: "Log in to save favorites",
        message: "Please sign in first to add or remove favorite items.",
      })
    ) {
      return null;
    }

    const targetId = String(product.id);
    let added = false;
    setWishlistItems((prev) => {
      const exists = prev.some((item) => String(item.id) === targetId);
      if (exists) {
        return prev.filter((item) => String(item.id) !== targetId);
      }
      added = true;
      return [...prev, { ...product, quantity: 1 }];
    });
    return added;
  };

  const updateWishlistQuantity = (id, nextQty) => {
    const safeQty = Math.max(1, Number(nextQty) || 1);
    setWishlistItems((prev) =>
      prev.map((item) =>
        String(item.id) === String(id) ? { ...item, quantity: safeQty } : item,
      ),
    );
  };

  const removeFromWishlist = (id) => {
    setWishlistItems((prev) =>
      prev.filter((item) => String(item.id) !== String(id)),
    );
  };

  const clearWishlist = () => setWishlistItems([]);

  const clearCart = async () => {
    const token = localStorage.getItem("authToken");
    const previousItems = cartItems;
    setCartItems([]);

    if (!token) return;

    try {
      await authRequestJson("/api/cart", {
        method: "DELETE",
        token,
      });
      await loadStock();
    } catch (error) {
      setCartItems(previousItems);
      if (
        error?.status === 401 ||
        String(error?.message || "").toLowerCase() === "unauthorized"
      ) {
        clearExpiredSession();
        return;
      }
      triggerToast(error?.message || "Could not clear cart");
    }
  };

  const addOrder = (order) => {
    if (!order) return;
    setOrderHistory((prev) => [order, ...prev]);
  };

  const updateCartQuantity = async (id, nextQty) => {
    if (Number(nextQty) <= 0) {
      await removeFromCart(id);
      return;
    }

    const targetId = normalizeId(id);
    const previousItems = cartItems;
    let requestedQtyValue = null;

    setCartItems((prev) => {
      const target = prev.find((item) => normalizeId(item.id) === targetId);
      if (!target) return prev;

      const requestedQty = Math.max(1, Number(nextQty) || 1);
      requestedQtyValue = requestedQty;
      if (requestedQty === target.quantity) return prev;

      if (requestedQty > target.quantity) {
        const need = requestedQty - target.quantity;
        const available = getProductStock(id);
        const allow = available === null ? need : Math.min(need, available);
        if (allow <= 0) {
          triggerToast("Out of stock");
          requestedQtyValue = null;
          return prev;
        }
        if (allow < need) {
          triggerToast("Reached stock limit");
        }
        requestedQtyValue = target.quantity + allow;
        return prev.map((item) =>
          normalizeId(item.id) === targetId
            ? { ...item, quantity: item.quantity + allow }
            : item,
        );
      }

      return prev.map((item) =>
        normalizeId(item.id) === targetId
          ? { ...item, quantity: requestedQty }
          : item,
      );
    });

    const token = localStorage.getItem("authToken");
    if (!token || requestedQtyValue === null) return;

    try {
      await authRequestJson(`/api/cart/items/${id}`, {
        method: "PATCH",
        token,
        body: { qty: requestedQtyValue },
      });
      await Promise.all([loadStock(), syncBackendCart()]);
    } catch (error) {
      setCartItems(previousItems);
      if (
        error?.status === 401 ||
        String(error?.message || "").toLowerCase() === "unauthorized"
      ) {
        clearExpiredSession();
        return;
      }
      triggerToast(error?.message || "Could not update cart quantity");
    }
  };

  const removeFromCart = async (id) => {
    const targetId = normalizeId(id);
    const previousItems = cartItems;
    setCartItems((prev) =>
      prev.filter((item) => normalizeId(item.id) !== targetId),
    );

    const token = localStorage.getItem("authToken");
    if (!token) return;

    try {
      await authRequestJson(`/api/cart/items/${id}`, {
        method: "DELETE",
        token,
      });
      await Promise.all([loadStock(), syncBackendCart()]);
    } catch (error) {
      setCartItems(previousItems);
      if (
        error?.status === 401 ||
        String(error?.message || "").toLowerCase() === "unauthorized"
      ) {
        clearExpiredSession();
        return;
      }
      triggerToast(error?.message || "Could not remove item from cart");
    }
  };

  useEffect(() => {
    loadStock();
    const intervalId = window.setInterval(loadStock, 30000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadStock();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!authIdentity) return undefined;

    const intervalId = window.setInterval(() => {
      syncBackendCart();
    }, 30000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncBackendCart();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [authIdentity]);

  useEffect(() => {
    const restoreScrollY = location.state?.restoreScrollY;
    if (
      typeof restoreScrollY !== "number" ||
      !Number.isFinite(restoreScrollY)
    ) {
      return;
    }
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: restoreScrollY, behavior: "auto" });
    });
  }, [location.key, location.state]);

  useEffect(() => {
    if (typeof location.state?.restoreScrollY === "number") return;
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  }, [location.pathname, location.state?.restoreScrollY]);

  useEffect(() => {
    const syncAuthIdentity = () => setAuthIdentity(getAuthIdentity());
    window.addEventListener("auth-changed", syncAuthIdentity);
    window.addEventListener("storage", syncAuthIdentity);
    return () => {
      window.removeEventListener("auth-changed", syncAuthIdentity);
      window.removeEventListener("storage", syncAuthIdentity);
    };
  }, []);

  useEffect(() => {
    setDidHydrateSavedState(false);
    if (!authIdentity) {
      setCartItems([]);
      setWishlistItems([]);
      setOrderHistory([]);
      setDidHydrateSavedState(true);
      return;
    }

    setWishlistItems(readStoredItems("wishlist", authIdentity));
    setOrderHistory(readStoredItems("orders", authIdentity));
    setCartItems(readStoredItems("cart", authIdentity));
    syncBackendCart().finally(() => {
      setDidHydrateSavedState(true);
    });
  }, [authIdentity]);

  useEffect(() => {
    if (!didHydrateSavedState || !authIdentity) return;
    writeStoredItems("cart", authIdentity, cartItems);
  }, [cartItems, authIdentity, didHydrateSavedState]);

  useEffect(() => {
    if (!didHydrateSavedState || !authIdentity) return;
    writeStoredItems("wishlist", authIdentity, wishlistItems);
  }, [wishlistItems, authIdentity, didHydrateSavedState]);

  useEffect(() => {
    if (!didHydrateSavedState || !authIdentity) return;
    writeStoredItems("orders", authIdentity, orderHistory);
  }, [orderHistory, authIdentity, didHydrateSavedState]);

  useEffect(() => {
    const onAuthChanged = () => {
      if (isAuthenticated()) return;
      setCartItems([]);
      setWishlistItems([]);
      setOrderHistory([]);
      setActivePanel((prev) => (prev === "wishlist" ? null : prev));
    };
    window.addEventListener("auth-changed", onAuthChanged);
    window.addEventListener("storage", onAuthChanged);
    return () => {
      window.removeEventListener("auth-changed", onAuthChanged);
      window.removeEventListener("storage", onAuthChanged);
    };
  }, [authIdentity]);

  useEffect(() => {
    const onScroll = () => setShowBackToHome(window.scrollY > 240);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleBackToHome = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      <Navbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        handlePanel={handlePanel}
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        wishlistCount={wishlistItems.length}
      />
      {activePanel ? (
        <button
          type="button"
          aria-label="Close side panel"
          onClick={handleClose}
          className="fixed inset-0 z-[210] bg-slate-900/30 backdrop-blur-[1px]"
        />
      ) : null}
      <Cart
        activePannel={activePanel}
        handleClose={handleClose}
        items={cartItems}
        onRemove={removeFromCart}
        onUpdateQty={updateCartQuantity}
        getProductStock={getProductStock}
        holdMinutes={CART_HOLD_MINUTES}
      />
      <Wishlist
        activePannel={activePanel}
        handleClose={handleClose}
        items={wishlistItems}
        onRemove={removeFromWishlist}
        onClear={clearWishlist}
        onAddToCart={addToCart}
        onUpdateQty={updateWishlistQuantity}
        getProductStock={getProductStock}
      />
      <Outlet
        context={{
          searchTerm,
          addToCart,
          toggleFavorite,
          isFavorite,
          showToast: triggerToast,
          openCart,
          openWishlist,
          wishlistItems,
          cartItems,
          orderHistory,
          removeFromCart,
          updateCartQuantity,
          getDatabaseStock,
          getProductStock,
          stockConnectionReady,
          refreshStock: loadStock,
          clearCart,
          addOrder,
          cartHoldMinutes: CART_HOLD_MINUTES,
        }}
      />
      <Footer />
      {showBackToHome ? (
        <button
          type="button"
          aria-label="Back to home"
          onClick={handleBackToHome}
          className="fixed bottom-6 right-180 z-[190] flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl shadow-blue-500/40 transition hover:-translate-y-1 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          <IoIosArrowUp className="text-2xl" />
        </button>
      ) : null}
      {showToast ? (
        <div className="fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-2xl">
          {toastMessage}
        </div>
      ) : null}
      {loginPrompt.open ? (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-extrabold text-slate-800">
              {loginPrompt.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {loginPrompt.message}
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeLoginPrompt}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={goToSignIn}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Layout;
