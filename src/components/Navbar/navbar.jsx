import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping } from "@fortawesome/free-solid-svg-icons";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

export default function Navbar() {
  return (
    <header>
      <nav className="container mx-auto p-2 bg-indigo-300">
        <div className="flex justify-center items-center w-full">
          {/* Search bar */}
          <div className="flex items-center border rounded-lg px-3 py-1 bg-white shadow-sm">
            {/* Font Awesome search icon */}
            <FontAwesomeIcon
              icon={faSearch}
              className="h-5 w-5 text-gray-400 mr-2"
            />

            {/* Input */}
            <input
              type="search"
              required
              placeholder="Search"
              className="flex-1 outline-none text-gray-700"
            />
          </div>

          {/* Cart icon */}
          <FontAwesomeIcon
            icon={faCartShopping}
            className="ml-12 text-xl text-gray-700"
          />
        </div>

        <div className="flex justify-between my-1">
          {/* Logo */}
          <div className="flex items-center px-12">
            <img
              src="/src/assets/medicine/AWaiYar-removebg-preview.png"
              id="logo"
              className="w-16 mr-5"
              alt="favicon"
            />
            <h2>Hello</h2>
          </div>

          {/* Menu */}
          <div className="hidden uppercase items-center space-x-10 md:flex pr-6">
            <a
              href="#"
              className="tracking-widest hover:text-cyan-300 hover:text-xl"
            >
              Home
            </a>
            <div className="relative group">
              <button className="tracking-widest hover:text-cyan-300 hover:text-xl">
                Medical
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className="ml-1 text-sm transition-transform duration-300 hover-group:rotate-180"
                />
              </button>
              <div className="absolute left-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                <a
                  href="#"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-cyan-300"
                >
                  Medicines
                </a>
                <a
                  href="#"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-cyan-300"
                >
                  Equipments
                </a>
                <a
                  href="#"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-cyan-300"
                >
                  Accessories
                </a>
              </div>
            </div>

            <a
              href="#"
              className="tracking-widest hover:text-cyan-300 hover:text-xl"
            >
              Module
            </a>
            <a
              href="#"
              className="tracking-widest hover:text-cyan-300 hover:text-xl"
            >
              Delivery
            </a>
            <a
              href="#"
              className="tracking-widest hover:text-cyan-300 hover:text-xl"
            >
              FAQ
            </a>
            <button
              type="button"
              className="bg-blue-900 text-white hover:bg-indigo-400 rounded-md hover:shadow-xs focus:outline-none py-1 px-3"
            >
              <a href="#">Login</a>
            </button>

            {/* Contact dropdown */}
            <div className="inline-block relative">
              <button
                id="contactbtn"
                className="bg-blue-900 text-white focus:outline-none py-1 px-3 contactbtn"
              >
                Contact
              </button>

              <div
                id="contactmenu"
                className="w-24 bg-white border border-gray-300 mt-2 absolute hidden z-20"
              >
                <a
                  href="#"
                  className="block text-gray-700 hover:bg-gray-100 px-4 py-2"
                >
                  Email
                </a>
                <a
                  href="#"
                  className="block text-gray-700 hover:bg-gray-100 px-4 py-2"
                >
                  Phone
                </a>
                <a
                  href="#"
                  className="block text-gray-700 hover:bg-gray-100 px-4 py-2"
                >
                  Social
                </a>
                <div className="border-t border-gray-300"></div>
                <a
                  href="#"
                  className="block text-gray-700 hover:bg-gray-100 px-4 py-2"
                >
                  Address
                </a>
              </div>
            </div>
          </div>

          {/* Burger button */}
          <button
            type="button"
            id="menu-btn"
            className="block md:hidden focus:outline-none burger-btn z-50"
          >
            <span className="line1"></span>
            <span className="line2"></span>
            <span className="line3"></span>
          </button>
        </div>

        {/* Mobile menu */}
        <div
          id="mobilemenu"
          className="w-full h-full hidden bg-slate-500 text-white uppercase tracking-widest fixed inset-0 z-20 px-6 py-20 opacity-90"
        >
          <div className="text-center py-3">
            <a href="#" className="hover:text-blue-900">
              Locations
            </a>
          </div>
          <div className="text-center py-3">
            <a href="#" className="hover:text-blue-900">
              Equipment
            </a>
          </div>
          <div className="text-center py-3">
            <a href="#" className="hover:text-blue-900">
              Blog
            </a>
          </div>
          <div className="text-center py-3">
            <a href="#" className="hover:text-blue-900">
              FAQ
            </a>
          </div>
          <div className="text-center py-3">
            <a href="#" className="hover:text-blue-900">
              SignUp
            </a>
          </div>
          <div className="text-center py-3">
            <a href="#" className="hover:text-blue-900">
              Login
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
}
