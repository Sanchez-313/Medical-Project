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
import Delivery from "./components/Delivery/delivery";
import SignIn from "./components/LogIn/SignIn";
import SignUp from "./components/LogIn/SignUp";
import ContactUs from "./components/ContactUs/ContactUs";
import CheckoutPage from "./components/CheckoutPage/CheckoutPage";


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
          path: "/Delivery",
          element: <Delivery />,
        },
        {
          path: "/checkoutpage",
          element: (
            <>
              <div className="pt-18"><CheckoutPage /></div>
            </>
          ),
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
};

export default App;