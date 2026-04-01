import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { GoHeartFill } from "react-icons/go";
import { FaBagShopping, FaBars, FaXmark, FaChevronDown } from "react-icons/fa6";
import { IoSearch } from "react-icons/io5";
import Logo from '../../assets/Logo/logo.png';

export const Navbar = ({ searchTerm = "", setSearchTerm, handlePanel, cartCount = 0, wishlistCount = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSupportDropdownOpen, setIsSupportDropdownOpen] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const toggleMenu = () => setShowMenu(!showMenu);
  const handleLogoClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const productPaths = new Set(["/allproducts", "/EnglishMedicine", "/MyanmarMedicine", "/Equipment"]);
  const scrollTopIfNonProductPath = (path) => {
    if (!productPaths.has(path)) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const refreshAuthUser = () => {
    try {
      const rawUser = localStorage.getItem("authUser");
      setAuthUser(rawUser ? JSON.parse(rawUser) : null);
    } catch {
      setAuthUser(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    setAuthUser(null);
    window.dispatchEvent(new Event("auth-changed"));
    setShowLogoutConfirm(false);
  };

  const openLogoutConfirm = () => setShowLogoutConfirm(true);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    refreshAuthUser();
    const onAuthChanged = () => refreshAuthUser();
    window.addEventListener("storage", onAuthChanged);
    window.addEventListener("auth-changed", onAuthChanged);
    return () => {
      window.removeEventListener("storage", onAuthChanged);
      window.removeEventListener("auth-changed", onAuthChanged);
    };
  }, []);

  const linkStyle = ({ isActive }) =>
    isActive
      ? "text-blue-600 font-bold border-b-2 border-dotted border-blue-400 pb-1"
      : "text-zinc-800 hover:text-blue-500 transition-colors";
  const getContinueShoppingState = () => {
    const disallowed = new Set(["/cart", "/checkoutpage"]);
    if (!disallowed.has(location.pathname)) {
      return {
        continueShoppingPath: location.pathname,
        continueShoppingScrollY: window.scrollY,
      };
    }

    const savedPath = sessionStorage.getItem("continueShoppingPath");
    const savedScroll = Number(sessionStorage.getItem("continueShoppingScrollY") || 0);
    return {
      continueShoppingPath:
        savedPath && !disallowed.has(savedPath) ? savedPath : "/allproducts",
      continueShoppingScrollY: Number.isFinite(savedScroll) ? savedScroll : 0,
    };
  };

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-white/95 backdrop-blur-md shadow-md py-4" : "bg-gray-100 py-6"
      }`}
    >
      <nav className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-4 sm:px-6 md:px-8 lg:px-10">
        {/* Logo Section */}
        <button
          type="button"
          onClick={handleLogoClick}
          className="flex items-center gap-2 group -ml-10 md:-ml-14 bg-transparent"
        >
          <img src={Logo} alt="VitalRx Logo" className="w-12 h-12 object-contain group-hover:rotate-12 transition-transform" />
          <div className="flex flex-col leading-none">
            <div className="flex items-baseline gap-1 whitespace-nowrap">
              <span className="text-lg md:text-[1.35rem] font-bold tracking-tight text-indigo-400 uppercase italic">
                AzureMed
              </span>
              <span className="text-lg md:text-[1.35rem] font-bold tracking-tight text-blue-600 uppercase italic">
                hub
              </span>
            </div>
            <span className="text-[8px] font-bold text-blue-400 uppercase tracking-[0.18em]">Digital Pharmacy</span>
          </div>
        </button>

        {/* Desktop Menu */}
        <ul className="hidden min-w-0 flex-1 items-center justify-end gap-x-5 pl-8 text-[12px] font-bold uppercase tracking-[0.12em] md:flex lg:gap-x-4 lg:pl-12">
          <li>
            <NavLink to="/" className={linkStyle} onClick={() => scrollTopIfNonProductPath("/")}>Home</NavLink>
          </li>

          {/* Pharmacy Dropdown */}
          <li
            className="relative"
            onMouseEnter={() => setIsDropdownOpen(true)}
            onMouseLeave={() => setIsDropdownOpen(false)}
          >
            <button className="flex items-center gap-1 text-zinc-800 hover:text-blue-500 transition-colors py-2 text-[12px]">
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

          {/* Support & Feedback Dropdown */}
          <li
            className="relative"
            onMouseEnter={() => setIsSupportDropdownOpen(true)}
            onMouseLeave={() => setIsSupportDropdownOpen(false)}
          >
            <button className="flex items-center gap-1 text-zinc-800 hover:text-blue-500 transition-colors py-2 text-[12px]">
              About Us{" "}
              <FaChevronDown className={`text-[10px] transition-transform ${isSupportDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isSupportDropdownOpen && (
              <div className="absolute top-full left-0 w-64 bg-white border border-zinc-100 shadow-2xl rounded-2xl py-4 flex flex-col z-[60] animate-in fade-in slide-in-from-top-2">
                <NavLink to="/aboutus" className="px-6 py-3 hover:bg-blue-50 hover:text-blue-600 transition-colors">About</NavLink>
                <NavLink to="/Process" className="px-6 py-3 hover:bg-blue-50 hover:text-blue-600 transition-colors">Support</NavLink>
                <NavLink to="/reviews" className="px-6 py-3 hover:bg-blue-50 hover:text-blue-600 transition-colors">Reviews</NavLink>
              </div>
            )}
          </li>
          <li>
            <NavLink to="/orders" className={linkStyle} onClick={() => scrollTopIfNonProductPath("/orders")}>
              Bills
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/detect-medicine"
              className={linkStyle}
              onClick={() => scrollTopIfNonProductPath("/detect-medicine")}
            >
              Detect Medicine
            </NavLink>
          </li>
          
          {/* <div className="h-6 w-[1px] bg-slate-200 mx-2"></div> */}

          {authUser ? (
            <>
              <li className="text-[12px] text-zinc-700 normal-case tracking-normal p-2 rounded-lg shadow-xl bg-gray-300">
                Hi, {authUser.name}
              </li>
              <li>
                <button
                  type="button"
                  onClick={openLogoutConfirm}
                  className="bg-slate-700 text-white px-6 py-2.5 rounded-full hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <li>
              <div className="flex items-center gap-3">
                <NavLink
                  to="/signin"
                  className="flex min-w-[112px] items-center justify-center rounded-full border-2 border-blue-600 px-6 py-2.5 text-blue-600 transition-all hover:bg-blue-50 active:scale-95"
                >
                  Sign In
                </NavLink>
                <NavLink
                  to="/signup"
                  className="flex min-w-[112px] items-center justify-center rounded-full bg-blue-600 px-6 py-2.5 text-white transition-all shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95"
                >
                  Sign Up
                </NavLink>
              </div>
            </li>
          )}
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button onClick={() => handlePanel("wishlist")} className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-full transition-all relative">
            <GoHeartFill size={22} />
            <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {wishlistCount}
            </span>
          </button>

          <button
            onClick={() =>
              navigate("/cart", {
                state: getContinueShoppingState(),
              })
            }
            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all relative"
          >
            <FaBagShopping size={20} />
            <span className="absolute top-1 right-1 bg-blue-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {cartCount}
            </span>
          </button>

          <button className="md:hidden text-3xl text-slate-800 z-[60]" onClick={toggleMenu}>
            {showMenu ? <FaXmark /> : <FaBars />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`fixed inset-0 bg-slate-400/95 z-[50] md:hidden transition-all duration-500 ease-in-out ${showMenu ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}`}>
          <div className="flex flex-col items-center justify-center h-full gap-y-6 px-10">
             <NavLink to="/" onClick={() => { scrollTopIfNonProductPath("/"); toggleMenu(); }} className="text-2xl font-bold text-slate-800">Home</NavLink>
             <NavLink to="/aboutus" onClick={() => { scrollTopIfNonProductPath("/aboutus"); toggleMenu(); }} className="text-2xl font-bold text-slate-800">About</NavLink>
             <NavLink to="/allproducts" onClick={toggleMenu} className="text-2xl font-bold text-slate-800">Pharmacy Shop</NavLink>
             <div className="text-2xl font-bold text-slate-800">Support & Feedback</div>
             <NavLink to="/orders" onClick={() => { scrollTopIfNonProductPath("/orders"); toggleMenu(); }} className="text-2xl font-bold text-slate-800">
               Bills
             </NavLink>
             <NavLink
               to="/detect-medicine"
               onClick={() => { scrollTopIfNonProductPath("/detect-medicine"); toggleMenu(); }}
               className="text-2xl font-bold text-slate-800"
             >
               Detect Medicine
             </NavLink>
             
             <div className="flex flex-col items-center gap-y-3">
               <NavLink to="/EnglishMedicine" onClick={toggleMenu} className="text-lg text-slate-500 hover:text-blue-600">English Medicines</NavLink>
               <NavLink to="/MyanmarMedicine" onClick={toggleMenu} className="text-lg text-slate-500 hover:text-blue-600">Myanmar Medicines</NavLink>
               <NavLink to="/Equipment" onClick={toggleMenu} className="text-lg text-slate-500 hover:text-blue-600">Medical Equipment</NavLink>
               <NavLink to="/Process" onClick={() => { scrollTopIfNonProductPath("/Process"); toggleMenu(); }} className="text-lg text-slate-500 hover:text-blue-600">Support</NavLink>
               <NavLink to="/reviews" onClick={() => { scrollTopIfNonProductPath("/reviews"); toggleMenu(); }} className="text-lg text-slate-500 hover:text-blue-600">Reviews</NavLink>
             </div>

             <div className="w-full h-[1px] bg-slate-100 my-2"></div>

             {/* Mobile Search */}
             <div className="w-full max-w-xs flex border-2 border-blue-500 rounded-full p-2 bg-slate-50">
                <input
                  type="text"
                  placeholder="Search..."
                  className="flex-1 px-4 bg-transparent focus:outline-none text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="bg-blue-500 text-white p-2 rounded-full">
                  <IoSearch />
                </button>
             </div>

             {authUser ? (
               <div className="flex flex-col w-full gap-4 mt-4">
                 <div className="w-full text-center py-3 text-slate-800 font-bold">Hi, {authUser.name}</div>
                 <button
                   type="button"
                   onClick={() => {
                     setShowLogoutConfirm(true);
                     toggleMenu();
                   }}
                   className="w-full text-center py-4 bg-slate-700 text-white rounded-2xl font-bold shadow-xl hover:bg-slate-800"
                 >
                   Logout
                 </button>
               </div>
             ) : (
               <div className="mt-4 grid w-full grid-cols-2 gap-4">
                 <NavLink
                   to="/signin"
                   onClick={toggleMenu}
                   className="flex w-full items-center justify-center text-center py-4 border-2 border-blue-600 text-blue-600 rounded-2xl font-bold hover:bg-indigo-400 hover:text-white hover:shadow-2xl"
                 >
                   Sign In
                 </NavLink>
                 <NavLink
                   to="/signup"
                   onClick={toggleMenu}
                   className="flex w-full items-center justify-center text-center py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl hover:bg-amber-100 hover:text-blue-600 hover:shadow-2xl"
                 >
                   Register
                 </NavLink>
               </div>
             )}
          </div>
        </div>
      </nav>
      {showLogoutConfirm ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <h3 className="text-xl font-extrabold text-slate-800">Log out now?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to log out from this account?
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-xl border border-slate-300 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
};
