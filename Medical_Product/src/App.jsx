import React from "react";
import Home from "./components/Home/Home";
import EnglishMedicines from "./components/EnglishMedicines/EnglishMedicines";
import { createBrowserRouter, Navigate, RouterProvider, useLocation } from "react-router-dom";
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
import DetectMedicine from "./components/DetectMedicine/DetectMedicine";
import AboutUs from "./components/AboutUs/AboutUs";

const RequireAuth = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem("authToken");
  const user = localStorage.getItem("authUser");

  if (!token && !user) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }

  return children;
};

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
          element: <AboutUs />,
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
        {
          path: "/detect-medicine",
          element: (
            <RequireAuth>
              <DetectMedicine />
            </RequireAuth>
          ),
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
};

export default App;
