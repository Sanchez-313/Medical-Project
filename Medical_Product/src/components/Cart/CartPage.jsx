import React, { useEffect } from "react";
import { useOutletContext, Link, useLocation, useNavigate } from "react-router-dom";
import { FaMinus, FaPlus, FaTrash } from "react-icons/fa";

const CartPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const outletContext = useOutletContext() || {};
  const { cartItems = [], removeFromCart, updateCartQuantity, getProductStock } = outletContext;
  const disallowedContinuePaths = new Set(["/cart", "/checkoutpage"]);
  const continueShoppingPath =
    location.state?.continueShoppingPath ||
    sessionStorage.getItem("continueShoppingPath") ||
    "/allproducts";
  const safeContinueShoppingPath =
    disallowedContinuePaths.has(continueShoppingPath) ? "/allproducts" : continueShoppingPath;
  const continueShoppingScrollY =
    typeof location.state?.continueShoppingScrollY === "number"
      ? location.state.continueShoppingScrollY
      : Number(sessionStorage.getItem("continueShoppingScrollY") || 0);

  useEffect(() => {
    if (
      location.state?.continueShoppingPath &&
      !disallowedContinuePaths.has(location.state.continueShoppingPath)
    ) {
      sessionStorage.setItem(
        "continueShoppingPath",
        location.state.continueShoppingPath
      );
    }
    if (typeof location.state?.continueShoppingScrollY === "number") {
      sessionStorage.setItem(
        "continueShoppingScrollY",
        String(location.state.continueShoppingScrollY)
      );
    }
  }, [location.state]);

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <div className="pt-28 pb-16">
      <div className="max-w-[1100px] mx-auto px-6">
        <h2 className="text-3xl font-extrabold text-slate-800 mb-8">Your Cart</h2>

        {cartItems.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 p-10 text-center text-slate-500">
            Your cart is empty.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="h-20 w-20">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold text-slate-800">
                      {item.name}
                    </h4>
                    <button
                      onClick={() => removeFromCart?.(item.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white"
                    >
                      <FaTrash />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-semibold text-slate-700">
                      {item.price.toLocaleString()} MMK
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateCartQuantity?.(item.id, item.quantity - 1)
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white"
                      >
                        <FaMinus />
                      </button>
                      <span className="min-w-[24px] text-center font-bold">
                        {item.quantity}
                      </span>
                      <button
                        disabled={getProductStock?.(item.id) === 0}
                        onClick={() =>
                          updateCartQuantity?.(item.id, item.quantity + 1)
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        <FaPlus />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6">
          <div className="text-lg font-bold text-slate-700">Subtotal</div>
          <div className="text-2xl font-black text-blue-600">
            {subtotal.toLocaleString()} MMK
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            type="button"
            onClick={() =>
              navigate(safeContinueShoppingPath, {
                state: { restoreScrollY: continueShoppingScrollY },
              })
            }
            className="rounded-full border border-slate-300 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Continue Shopping
          </button>
          <Link
            to="/checkoutpage"
            className="rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700"
          >
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
