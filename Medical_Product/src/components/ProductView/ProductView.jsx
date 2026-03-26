import React, { useState, useEffect } from "react";
import {
  Star,
  ShoppingCart,
  Heart,
  Plus,
  Minus,
  CheckCircle,
  Truck,
  ShieldCheck,
  RotateCcw,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { FaShoppingBag } from "react-icons/fa";

const ProductView = ({ isOpen, onClose, product, onAddToCart }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const outletContext = useOutletContext();
  const addToCart = onAddToCart || outletContext?.addToCart;
  const toggleFavorite = outletContext?.toggleFavorite;
  const isFavorite = outletContext?.isFavorite;
  const showToast = outletContext?.showToast;
  const getProductStock = outletContext?.getProductStock;
  const [quantity, setQuantity] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [liveStock, setLiveStock] = useState(null);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const closeProductView = () => {
    if (onClose) {
      onClose();
      return;
    }
    navigate("/");
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const productId = Number(product?.id);
    if (!Number.isInteger(productId) || productId <= 0) {
      setLiveStock(null);
      setIsLoadingStock(false);
      return;
    }

    const controller = new AbortController();
    const loadStock = async () => {
      setIsLoadingStock(true);
      try {
        const response = await fetch(
          `http://localhost:8000/api/products/${productId}`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error("Failed to load stock");
        const payload = await response.json();
        const stockValue = payload?.data?.product?.stock;
        setLiveStock(
          Number.isFinite(Number(stockValue)) ? Number(stockValue) : null
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          setLiveStock(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingStock(false);
        }
      }
    };

    loadStock();
    return () => controller.abort();
  }, [isOpen, product?.id]);

  if (!isOpen) return null;

  const {
    name = "Amoxicillin 500mg",
    price = 25000,
    image = null,
    category = "Antibiotics",
    stock = null,
    description = "Product details are available in the label and packaging. Use as directed.",
    id = name,
  } = product || {};
  const contextStock = getProductStock?.(id);
  const favoriteActive = Boolean(isFavorite?.(id));
  const normalizedLiveStock = Number.isFinite(Number(liveStock))
    ? Number(liveStock)
    : null;
  const normalizedContextStock = Number.isFinite(Number(contextStock))
    ? Number(contextStock)
    : null;
  const normalizedPropStock = Number.isFinite(Number(stock))
    ? Number(stock)
    : null;

  // If cart has reserved quantity, show that reduced stock immediately in UI.
  const displayStock =
    normalizedContextStock !== null && normalizedLiveStock !== null
      ? Math.min(normalizedContextStock, normalizedLiveStock)
      : normalizedContextStock ??
        normalizedLiveStock ??
        normalizedPropStock;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300 pointer-events-none">
      <style>
        {`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}
      </style>

      <div className="bg-white w-full max-w-[1050px] max-h-[94vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in duration-300 relative pointer-events-auto">
        
        {/* Close Button */}
        <button
          onClick={closeProductView}
          className="absolute right-6 top-6 z-[60] text-slate-400 hover:text-blue-600 transition-all p-2 bg-white/90 backdrop-blur-md rounded-full shadow-md hover:rotate-90"
        >
          <X size={24} />
        </button>

        {/* Left Side: Product Image */}
        <div className="w-full md:w-5/12 bg-slate-50 p-8 md:p-10 flex flex-col items-center justify-center relative border-r border-slate-100">
          <div className="absolute top-8 left-8">
            <span className="bg-blue-600 text-white text-[10px] font-black px-4 py-2 rounded-full tracking-widest uppercase shadow-lg shadow-blue-200">
              Verified Product
            </span>
          </div>

          <div 
            onClick={() => setIsZoomed(true)}
            className="w-full aspect-square bg-white rounded-[2.5rem] shadow-sm flex items-center justify-center border border-slate-100 p-8 group cursor-zoom-in"
          >
            {image ? (
              <img
                src={image}
                alt={name}
                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="text-7xl">💊</div>
            )}
          </div>
          
          {/* Simple Lightbox Overlay */}
          {isZoomed && (
            <div
              className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-[110] cursor-zoom-out"
              onClick={() => setIsZoomed(false)}
            >
              <img src={image} alt={name} className="max-w-[90%] max-h-[90%] object-contain" />
              <p className="absolute bottom-10 text-white/50 text-sm">Click anywhere to close</p>
            </div>
          )}
        </div>

        {/* Right Side: Content */}
        <div className="w-full md:w-7/12 p-8 md:p-12 flex flex-col overflow-y-auto bg-white no-scrollbar">
          <div className="mb-2">
            <span className="text-blue-500 font-bold text-[11px] tracking-[0.2em] uppercase">
              {category} • Prescription Required
            </span>
          </div>

          <h1 className="text-slate-900 text-3xl md:text-4xl font-black leading-tight mb-4 tracking-tighter">
            {name.split(" ")[0]}{" "}
            <span className="font-light text-slate-400">
              {name.split(" ").slice(1).join(" ")}
            </span>
          </h1>

          <div className="mb-8">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-blue-600 tracking-tighter">
                {Math.round(price * 0.7).toLocaleString()} 
                <span className="text-lg text-black font-medium ml-2">MMK</span>
              </span>
              <span className="text-lg text-slate-300 line-through decoration-2">
                {price.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-emerald-600 text-[11px] font-black uppercase tracking-widest mt-4">
              <div className="size-5 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle size={12} strokeWidth={4} />
              </div>
              <span>Ready for delivery in Mandalay</span>
            </div>
            <p className="mt-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Stock:{" "}
              <span
                className={
                  isLoadingStock
                    ? "text-slate-500"
                    : displayStock > 0
                      ? "text-emerald-600"
                      : "text-red-500"
                }
              >
                {isLoadingStock
                  ? "Loading..."
                  : displayStock === null
                    ? "Unavailable"
                    : displayStock > 0
                      ? `${displayStock} available`
                      : "Out of stock"}
              </span>
            </p>
          </div>

          {/* Description */}
          <div className="mb-8 p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              {description}
            </p>
          </div>

          {/* Quantity & Actions */}
          <div className="flex flex-col gap-5 mb-10">
            <div className="flex items-center gap-4">
              <div className="flex items-center w-40 h-14 bg-slate-100 rounded-2xl p-1.5 border border-slate-200">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex-1 flex justify-center text-slate-400 hover:text-blue-600 transition-colors"
                >
                  <Minus size={18} />
                </button>
                <span className="flex-1 text-center font-black text-slate-900">
                  {quantity}
                </span>
                <button
                  disabled={displayStock !== null && quantity >= displayStock}
                  onClick={() => setQuantity(quantity + 1)}
                  className="flex-1 flex justify-center text-slate-400 hover:text-blue-600 transition-colors disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  <Plus size={18} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  const changedToFavorite = toggleFavorite?.({
                    id,
                    name,
                    price,
                    image,
                    category,
                  });
                  if (showToast && typeof changedToFavorite === "boolean") {
                    showToast(
                      changedToFavorite
                        ? "Added to favorites"
                        : "Removed from favorites"
                    );
                  }
                }}
                className={`h-14 w-14 bg-white border-2 rounded-2xl transition-all flex items-center justify-center group ${
                  favoriteActive
                    ? "border-red-500 text-red-500"
                    : "border-slate-100 text-slate-300 hover:border-red-500 hover:text-red-500"
                }`}
              >
                <Heart
                  size={22}
                  className={favoriteActive ? "fill-red-500" : "group-hover:fill-red-500"}
                />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  if (addToCart) {
                    const added = addToCart({ id, name, price, image, category }, quantity);
                    if (typeof added === "number" && added > 0) {
                      setQuantity(1);
                    }
                  }
                }}
                disabled={displayStock === 0}
                className="w-full h-14 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-slate-200 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
              >
                <ShoppingCart size={20} /> Add to Cart
              </button>
              <button
                onClick={() => {
                  navigate("/cart", {
                    state: {
                      continueShoppingPath: location.pathname,
                      continueShoppingScrollY: window.scrollY,
                    },
                  });
                  closeProductView();
                }}
                className="w-full h-14 bg-white text-slate-800 font-bold rounded-2xl border border-slate-200 hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-sm"
              >
                View Cart
              </button>
              <Link
                to="/checkoutpage"
                onClick={() => {
                  closeProductView();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="w-full h-14 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                <FaShoppingBag size={18} /> Checkout
              </Link>
            </div>
          </div>

          {/* Footer Features - Cleaned up logic */}
          <div className="mt-auto pt-8 border-t border-slate-100 grid grid-cols-3 gap-2">
            {[
              { icon: <Truck size={20} />, label: "Fast Shipping", color: "text-blue-500", bg: "bg-blue-50" },
              { icon: <ShieldCheck size={20} />, label: "Verified", color: "text-emerald-500", bg: "bg-emerald-50" },
              { icon: <RotateCcw size={20} />, label: "Returnable", color: "text-orange-500", bg: "bg-orange-50" },
            ].map((f, idx) => (
              <div key={idx} className="flex flex-col items-center text-center gap-2">
                <div className={`p-2.5 ${f.bg} ${f.color} rounded-2xl`}>
                  {f.icon}
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                  {f.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductView;
