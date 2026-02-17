import React, { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { GoHeartFill } from "react-icons/go";
import { FaBagShopping, FaBars, FaXmark, FaChevronDown } from "react-icons/fa6";
import { IoSearch } from "react-icons/io5";
import Logo from '../../assets/Logo/logo.png';

export const Navbar = ({ setSearchTerm, handlePanel }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleMenu = () => setShowMenu(!showMenu);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkStyle = ({ isActive }) =>
    isActive
      ? "text-blue-600 font-bold border-b-2 border-blue-600 pb-1"
      : "text-zinc-800 hover:text-blue-500 transition-colors";

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-white/95 backdrop-blur-md shadow-md py-4" : "bg-gray-100 py-6"
      }`}
    >
      <nav className="max-w-[1400px] mx-auto px-12 md:px-10 flex justify-between items-center">
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-2 group">
          <img src={Logo} alt="VitalRx Logo" className="w-12 h-12 object-contain group-hover:rotate-12 transition-transform" />
          <div className="flex flex-col leading-none">
            <span className="text-2xl font-bold tracking-tighter text-indigo-400 uppercase italic">
              AzureMed<span className="text-blue-600 text-2xl"> hub</span>
            </span>
            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-[0.2em]">Digital Pharmacy</span>
          </div>
        </Link>

        {/* Desktop Menu */}
        <ul className="md:flex items-center gap-x-8 hidden text-sm font-bold uppercase tracking-widest">
          <li>
            <NavLink to="/" className={linkStyle}>Home</NavLink>
          </li>

          {/* Pharmacy Dropdown */}
          <li
            className="relative"
            onMouseEnter={() => setIsDropdownOpen(true)}
            onMouseLeave={() => setIsDropdownOpen(false)}
          >
            <button className="flex items-center gap-1 text-zinc-800 hover:text-blue-500 transition-colors py-2">
              Pharmacy <FaChevronDown className={`text-[10px] transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 w-64 bg-white border border-zinc-100 shadow-2xl rounded-2xl py-4 flex flex-col z-[60] animate-in fade-in slide-in-from-top-2">
                <NavLink to="/allproducts" className="px-6 py-3 hover:bg-blue-50 hover:text-blue-600 transition-colors">All Products</NavLink>
                <NavLink to="/EnglishMedicine" className="px-6 py-3 hover:bg-blue-50 hover:text-blue-600 transition-colors">English Medicines</NavLink>
                <NavLink to="/MyanmarMedicine" className="px-6 py-3 hover:bg-blue-50 hover:text-blue-600 transition-colors">Myanmar Medicines</NavLink>
                <NavLink to="/Equipment" className="px-6 py-3 hover:bg-blue-50 hover:text-blue-600 transition-colors">Medical Equipment</NavLink>
              </div>
            )}
          </li>

          <li>
            <NavLink to="/Process" className={linkStyle}>Support</NavLink>
          </li>
          
          <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>

          <li>
            <NavLink to="/signin" className="text-zinc-600 hover:text-blue-600 transition-colors">Sign In</NavLink>
          </li>
          <li>
            <NavLink to="/signup" className="bg-blue-600 text-white px-6 py-2.5 rounded-full hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95">
              Sign Up
            </NavLink>
          </li>
        </ul>

        {/* Action Icons */}
        <div className="flex items-center gap-x-3 md:gap-x-5">
          {/* Desktop Search */}
          <div className="hidden lg:flex items-center bg-slate-100 rounded-full px-4 py-1.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
            <IoSearch className="text-slate-400" />
            <input
              type="text"
              placeholder="Search pharmacy..."
              className="bg-transparent border-none focus:outline-none text-sm ml-2 w-32 xl:w-48"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button onClick={() => handlePanel("wishlist")} className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-full transition-all relative">
            <GoHeartFill size={22} />
            <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">0</span>
          </button>

          <button onClick={() => handlePanel("cart")} className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all relative">
            <FaBagShopping size={20} />
            <span className="absolute top-1 right-1 bg-blue-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">0</span>
          </button>

          <button className="md:hidden text-3xl text-slate-800 z-[60]" onClick={toggleMenu}>
            {showMenu ? <FaXmark /> : <FaBars />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`fixed inset-0 bg-slate-400/95 z-[50] md:hidden transition-all duration-500 ease-in-out ${showMenu ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}`}>
          <div className="flex flex-col items-center justify-center h-full gap-y-6 px-10">
             <NavLink to="/" onClick={toggleMenu} className="text-2xl font-bold text-slate-800">Home</NavLink>
             <NavLink to="/allproducts" onClick={toggleMenu} className="text-2xl font-bold text-slate-800">Pharmacy Shop</NavLink>
             
             <div className="flex flex-col items-center gap-y-3">
               <NavLink to="/EnglishMedicine" onClick={toggleMenu} className="text-lg text-slate-500 hover:text-blue-600">English Medicines</NavLink>
               <NavLink to="/MyanmarMedicine" onClick={toggleMenu} className="text-lg text-slate-500 hover:text-blue-600">Myanmar Medicines</NavLink>
               <NavLink to="/Equipment" onClick={toggleMenu} className="text-lg text-slate-500 hover:text-blue-600">Medical Equipment</NavLink>
             </div>

             <div className="w-full h-[1px] bg-slate-100 my-2"></div>

             {/* Mobile Search */}
             <div className="w-full max-w-xs flex border-2 border-blue-500 rounded-full p-2 bg-slate-50">
                <input
                  type="text"
                  placeholder="Search..."
                  className="flex-1 px-4 bg-transparent focus:outline-none text-base"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="bg-blue-500 text-white p-2 rounded-full">
                  <IoSearch />
                </button>
             </div>

             <div className="flex flex-row w-full gap-4 mt-4">
               <NavLink to="/signin" onClick={toggleMenu} className="w-full text-center py-4 border-2 border-blue-600 text-blue-600 rounded-2xl font-bold hover:bg-indigo-400 hover:text-white hover:shadow-2xl">Sign In</NavLink>
               <NavLink to="/signup" onClick={toggleMenu} className="w-full text-center py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl hover:bg-amber-100 hover:text-blue-600 hover:shadow-2xl">Register</NavLink>
             </div>
          </div>
        </div>
      </nav>
    </header>
  );
};