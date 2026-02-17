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
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { FaShoppingBag } from "react-icons/fa";

// Assets
import Paracetamol from "../../assets/Engmedicines/Paracetamol.png";
import Oramin_G from "../../assets/Engmedicines/Oramin-G.png";
import IVYTUS_Cough_Syrup from "../../assets/Engmedicines/IVYTUS_Cough_Syrup.png";

const ProductView = ({ isOpen, onClose, product }) => {
  const [quantity, setQuantity] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);

  const relatedProducts = [
    { id: 1, name: "Paracetamol", price: "18,000", image: Paracetamol },
    { id: 2, name: "Oramin-G", price: "12,500", image: Oramin_G },
    { id: 3, name: "IVYTUS Syrup", price: "5,000", image: IVYTUS_Cough_Syrup },
    { id: 4, name: "Paracetamol", price: "8,500", image: Paracetamol },
  ];

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

  if (!isOpen) return null;

  const {
    name = "Amoxicillin 500mg",
    price = 25000,
    image = null,
    category = "Antibiotics",
    description = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
  } = product || {};

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <style>
        {`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}
      </style>

      <div className="bg-white w-full max-w-[1050px] max-h-[94vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in duration-300 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
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
                  onClick={() => setQuantity(quantity + 1)}
                  className="flex-1 flex justify-center text-slate-400 hover:text-blue-600 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
              <button className="h-14 w-14 bg-white border-2 border-slate-100 hover:border-red-500 text-slate-300 hover:text-red-500 rounded-2xl transition-all flex items-center justify-center group">
                <Heart size={22} className="group-hover:fill-red-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button className="w-full h-14 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-slate-200">
                <ShoppingCart size={20} /> Add to Cart
              </button>
              <Link
                to="/checkoutpage"
                onClick={() => {
                  onClose();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="w-full h-14 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                <FaShoppingBag size={18} /> Checkout
              </Link>
            </div>
          </div>

          {/* Related Products */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-5">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Commonly Bought Together
              </h4>
              <button className="text-blue-600 text-[10px] font-black flex items-center gap-1 uppercase tracking-widest hover:underline">
                View Alternatives <ChevronRight size={12} />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
              {relatedProducts.map((item) => (
                <div
                  key={item.id}
                  className="min-w-[150px] p-4 bg-slate-50 rounded-3xl border border-slate-100 hover:border-blue-300 hover:bg-white transition-all cursor-pointer group shadow-sm"
                >
                  <div className="h-24 bg-white rounded-2xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform p-2 border border-slate-50">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <p className="text-[11px] font-black text-slate-800 truncate mb-1">
                    {item.name}
                  </p>
                  <p className="text-[10px] font-bold text-blue-600">
                    {item.price} MMK
                  </p>
                </div>
              ))}
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