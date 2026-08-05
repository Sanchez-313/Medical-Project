"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaMinus, FaPlus, FaTrash } from "react-icons/fa";
import { useCart } from "@/components/CartContext";

/** Faithful port of Medical_Product/src/components/Cart/Cart.jsx. */
export default function CartPanel() {
  const { cartItems, activePanel, closePanel, updateCartQty, removeFromCart } = useCart();
  const router = useRouter();
  const isOpen = activePanel === "cart";
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div
      className={`flex flex-col justify-between gap-5 fixed top-0 right-0 bottom-0 z-[220] w-full max-w-[400px] border-l border-zinc-300 py-7 transform transition-transform duration-300 bg-white ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="px-10">
        <h3 className="text-3xl font-bold text-zinc-800 text-center">Your Cart</h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {cartItems.length === 0 ? (
          <div className="px-10 py-12 text-center text-zinc-500">Your cart is empty.</div>
        ) : (
          cartItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3 bg-white px-5 py-3 border-y border-zinc-200">
              <div className="relative w-16 h-16 shrink-0">
                {item.image_url && <Image src={item.image_url} fill className="object-contain" alt={item.name} />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-zinc-800 text-sm">{item.name}</h4>
                  <button
                    onClick={() => removeFromCart(item.medicineId)}
                    className="w-8 h-8 bg-red-600 rounded-full text-white flex justify-center items-center"
                  >
                    <FaTrash />
                  </button>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span>{item.price.toLocaleString()} MMK</span>
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => updateCartQty(item.medicineId, item.quantity - 1)}
                      className="w-7 h-7 bg-blue-600 rounded-full text-white flex justify-center items-center text-[14px] active:bg-blue-700"
                    >
                      <FaMinus />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      disabled={item.quantity >= item.stock_qty}
                      onClick={() => updateCartQty(item.medicineId, item.quantity + 1)}
                      className="w-7 h-7 bg-blue-600 rounded-full text-white flex justify-center items-center text-[14px] active:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      <FaPlus />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-10 border-y border-zinc-300">
        <div className="flex justify-between pt-2">
          <span className="text-zinc-800">Subtotal</span>
          <span className="text-zinc-800">{subtotal.toLocaleString()} MMK</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-zinc-800">Shipping &amp; Handlings</span>
          <span className="text-zinc-800">0 MMK</span>
        </div>
        <div className="flex justify-between py-2 border-t border-zinc-300">
          <span className="text-lg text-blue-600 font-bold">Order Total</span>
          <span className="text-lg text-blue-600 font-bold">{subtotal.toLocaleString()} MMK</span>
        </div>
      </div>

      <div className="flex gap-x-2 px-10">
        <button className="bg-blue-600 text-white flex-1 h-14 rounded active:bg-blue-700" onClick={closePanel}>
          Close
        </button>
        <button
          disabled={cartItems.length === 0}
          onClick={() => {
            closePanel();
            router.push("/checkout");
          }}
          className="bg-blue-600 text-white flex-1 h-14 rounded active:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Checkout
        </button>
      </div>
    </div>
  );
}
