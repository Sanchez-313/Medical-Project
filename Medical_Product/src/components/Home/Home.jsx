import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { Navbar } from "../Navbar/Navbar";
import Hero from "../Hero/Hero";
import Category from "../Category/Category";
import Values from "../Values/Values";
import Products from "../Products/Products";
import Discount from "../Discount/Discount";
import Process from "../Process/Process";
import Testimonials from "../Testimonials/Testimonials";
import Delivery from '../Delivery/delivery'
import FAQ from '../FAQsection/faq'
import Footer from "../Footer/Footer";
import Cart from "../Cart/Cart";
import Wishlist from "../Wishlist.jsx/Wishlist";
import SignIn from "../LogIn/SignIn";
import SignUp from "../LogIn/SignUp";
import ProductView from "../ProductView/ProductView";

const App = () => {
  const navigate = useNavigate(); // For closing the overlays
  const [searchTerm, setSearchTerm] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [activePanel, setActivePanel] = useState(null);

  useEffect(() => {
    const changeNavbar = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', changeNavbar);
    return () => window.removeEventListener('scroll', changeNavbar);
  }, []);

  const handleScroll = () => {
    const section = document.getElementById('product-section');
    if(section) section.scrollIntoView({ behavior : 'smooth'});
  };

  const handlePanel = (tabName) => setActivePanel(prev => prev === tabName ? null : tabName);
  const handleClose = () => setActivePanel(null);

  return (
    <div className="relative">
      <Navbar 
        handleScroll={handleScroll} 
        setSearchTerm={setSearchTerm} 
        isScrolled={isScrolled} 
        handlePanel={handlePanel} 
      />
      
      <main>
        <Hero />
        <Cart activePannel={activePanel} handleClose={handleClose} />
        <Wishlist activePannel={activePanel} handleClose={handleClose} />
        <Category />
        <Values />
        <Products searchTerm={searchTerm} />
        <Discount />
        <Process />
        <Delivery />
        <FAQ />
        <Testimonials />
      </main>

      {/* OVERLAY ROUTES */}
      <Routes>
        <Route 
          path="/signin" 
          element={<SignIn isOpen={true} onClose={() => navigate('/')} />} 
        />
        <Route 
          path="/signup" 
          element={<SignUp isOpen={true} onClose={() => navigate('/')} />} 
        />

        <Route 
          path="/productview" 
          element={<ProductView isOpen={true} onClose={() => navigate('/')} />} 
        />
        
      </Routes>
    </div>
  );
};

export default App;