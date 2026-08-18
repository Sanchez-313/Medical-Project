import React from "react";
import { Link, NavLink } from "react-router-dom";
import { IoIosArrowForward } from "react-icons/io";
import Logo from "../../assets/Logo/logo.png";
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-zinc-100 py-10">
      <div className="flex flex-wrap gap-y-12 max-w-[1400px] mx-auto px-10">
        <div className="flex-1 basis-[300px]">
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src={Logo}
              alt="VitalRx Logo"
              className="w-12 h-12 object-contain hover:rotate-12 transition-transform"
            />
            <div className="flex flex-col leading-none">
              <span className="text-2xl font-bold tracking-tighter text-indigo-400 uppercase italic">
                AzureMed<span className="text-blue-600 text-2xl"> hub</span>
              </span>
              <span className="text-[9px] font-bold text-blue-400 uppercase tracking-[0.2em]">
                Digital Pharmacy
              </span>
            </div>
          </Link>

          <p className="text-zinc-600 mt-6 max-w-[350px]">
            AzureMed Hub helps customers discover trusted medicines, practical
            equipment, and healthcare support in one simple storefront.
          </p>

          <p className="text-zinc-800 mt-6">
            {currentYear} &copy; All Rights Reserved
          </p>
        </div>

        <ul className="flex-1">
          <li>
            <h5 className="text-zinc-800 text-2xl font-bold">Company</h5>
          </li>
          <li className="mt-6">
            <NavLink to="/aboutus" className="text-zinc-800 hover:text-indigo-500">
              About
            </NavLink>
          </li>
          <li className="mt-6">
            <NavLink to="/Process" className="text-zinc-800 hover:text-indigo-500">
              FAQ's
            </NavLink>
          </li>
        </ul>

        <ul className="flex-1">
          <li>
            <h5 className="text-zinc-800 text-2xl font-bold">Support</h5>
          </li>
          <li className="mt-6">
            <NavLink to="/Process" className="text-zinc-800 hover:text-indigo-500">
              Support Center
            </NavLink>
          </li>
          <li className="mt-6">
            <NavLink to="/reviews" className="text-zinc-800 hover:text-indigo-500">
              Feedback
            </NavLink>
          </li>
          <li className="mt-6">
            <NavLink to="/Process" className="text-zinc-800 hover:text-indigo-500">
              Contact Us
            </NavLink>
          </li>
        </ul>

        <div className="flex-1">
          <h5 className="text-zinc-800 text-2xl font-bold">Stay Connected</h5>

          <p className="mt-6 text-zinc-600">
            Questions or Feedback?
            <br />
            We'd love to hear from you
          </p>

          <div className="flex bg-white p-1 rounded-lg mt-6">
            <input
              type="email"
              name="email"
              id="email"
              autoComplete="off"
              placeholder="Email Address"
              className="h-[5vh] pl-4 flex-1 focus:outline-none"
            />
            <button className="bg-gradient-to-b from-indigo-400 to-indigo-060 p-2 rounded-lg text-white text-2xl hover:to-amber-600 cursor-pointer">
              <IoIosArrowForward />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
