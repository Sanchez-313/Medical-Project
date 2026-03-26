import React from "react";
import Home from "./components/Home/Home";
import EnglishMedicines from "./components/EnglishMedicines/EnglishMedicines";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import MyanmarMedicine from "./components/MyanmarMedicine/MyanmarMedicine";
import Equipments from "./components/Equipments/Equipments";
import Allproducts from "./components/Allproducts/Allproducts";
import Process from "./components/Process/Process";
import Values from "./components/Values/Values";
import Layout from "./components/Layout/Layout";
import SignIn from "./components/LogIn/SignIn";
import SignUp from "./components/LogIn/SignUp";
import ContactUs from "./components/ContactUs/ContactUs";
import CheckoutPage from "./components/CheckoutPage/CheckoutPage";
import ProductView from "./components/ProductView/ProductView";
import CartPage from "./components/Cart/CartPage";
import Reviews from "./components/Reviews/Reviews";
import Orders from "./components/Orders/Orders";


const App = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          path: "/",
          element: <Home />,
          children: [
            {
              path: "signin",
              element: <SignIn isOpen={true} />,
            },
            {
              path: "signup",
              element: <SignUp isOpen={true} />,
            },
            {
              path: "productview",
              element: <ProductView isOpen={true} />,
            },
          ],
        },
        {
          path: "/EnglishMedicine",
          element: <EnglishMedicines />,
        },
        {
          path: "/MyanmarMedicine",
          element: <MyanmarMedicine />,
        },
        {
          path: "/Equipment",
          element: <Equipments />,
        },
        {
          path: "/allproducts",
          element: <Allproducts />,
        },
        {
          path: "/Process",
          element: (
            <>
              <div className="pt-10">
                <Values />
              </div>
              <Process />
              <ContactUs />
            </>
          ),
        },
        {
          path: "/aboutus",
          element: (
            <>
              <div className="pt-24 pb-12">
                <div className="mx-auto max-w-[1100px] px-6 text-center">
                  <h1 className="text-4xl font-black text-slate-800">About Us</h1>
                  <p className="mt-4 text-slate-600 md:text-lg">
                    At AzureMed Hub, we make healthcare access easier by combining trusted
                    pharmacy products, medical equipment, and a simple digital shopping
                    experience for families across Myanmar.
                  </p>
                </div>

                <div className="mx-auto mt-10 grid max-w-[1100px] grid-cols-1 gap-6 px-6 md:grid-cols-3">
                  <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-extrabold text-slate-800">Who We Are</h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      We are a healthcare-focused team building a reliable online destination
                      for English medicines, Myanmar traditional medicines, and essential
                      medical equipment.
                    </p>
                  </article>

                  <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-extrabold text-slate-800">Our Mission</h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      Our mission is to deliver safe, authentic, and affordable medical products
                      with clear product information, transparent stock visibility, and smooth
                      doorstep delivery.
                    </p>
                  </article>

                  <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-extrabold text-slate-800">Why Choose Us</h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      We focus on product quality, fast support, and a customer-friendly buying
                      process. From quick view to checkout, every step is designed to be simple,
                      secure, and dependable.
                    </p>
                  </article>
                </div>
              </div>
              <Values />
              <Process />
              <ContactUs />
            </>
          ),
        },
        {
          path: "/checkoutpage",
          element: (
            <>
              <div className="pt-18"><CheckoutPage /></div>
            </>
          ),
        },
        {
          path: "/cart",
          element: <CartPage />,
        },
        {
          path: "/reviews",
          element: <Reviews />,
        },
        {
          path: "/orders",
          element: <Orders />,
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
};

export default App;
