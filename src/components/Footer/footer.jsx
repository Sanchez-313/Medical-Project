export default function Footer() {
  return (
    <>
      <footer className="bg-indigo-300 pt-2 pb-4">
        <div className="container mx-auto">
          <div className="flex flex-wrap-4">
            <div className="w-full md:w-1/2 md:pl-10 md:pr-4 pl-20 pr-24 ">
              <div className="flex">
                <img
                  src="/src/assets/Banner/boy.avif"
                  className="w-12 rounded-4xl"
                  alt="logo"
                />
                <h2 className="p-3 font-bold text-lg">Md Name</h2>
              </div>
              <h5>
                Your trusted partner in medical equiments and supplies since
                2020.
              </h5>
            </div>

            <div className="w-full md:w-1/2">
              <h5 className="text-gray-600 text-lg font-semibold ">Products</h5>
              <ul className="list-none">
                <li className="pt-1">
                  <a
                    href="javascript:void(0);"
                    className="text-white text-sm font-semibold duration-150 hover:text-blue-700 hover:text-[15px]"
                  >
                    Diagnostic Equiments
                  </a>
                </li>
                <li className="pt-1">
                  <a
                    href="javascript:void(0);"
                    className="text-white text-sm font-semibold duration-150 hover:text-blue-700 hover:text-[15px]"
                  >
                    Pharmaceuticals
                  </a>
                </li>
                <li className="pt-1">
                  <a
                    href="javascript:void(0);"
                    className="text-white text-sm font-semibold duration-150 hover:text-blue-700 hover:text-[15px]"
                  >
                    Medical Boxs
                  </a>
                </li>
                <li className="pt-1">
                  <a
                    href="javascript:void(0);"
                    className="text-white text-sm font-semibold duration-150 hover:text-blue-700 hover:text-[16px]"
                  >
                    Healthcare Supplies
                  </a>
                </li>
              </ul>
            </div>

            <div className="w-full md:w-1/2">
              <h5 className="text-gray-600 text-lg font-semibold ">Company</h5>
              <ul className="list-none">
                <li className="pt-1">
                  <a
                    href="javascript:void(0);"
                    className="text-white text-sm font-semibold duration-150 hover:text-blue-700 hover:text-[15px]"
                  >
                    About us
                  </a>
                </li>
                <li className="pt-1">
                  <a
                    href="javascript:void(0);"
                    className="text-white text-sm font-semibold duration-150 hover:text-blue-700 hover:text-[15px]"
                  >
                    Our Team
                  </a>
                </li>
                <li className="pt-1">
                  <a
                    href="javascript:void(0);"
                    className="text-white text-sm font-semibold duration-150 hover:text-blue-700 hover:text-[15px]"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li className="pt-1">
                  <a
                    href="javascript:void(0);"
                    className="text-white text-sm font-semibold duration-150 hover:text-blue-700 hover:text-[15px]"
                  >
                    FeedBack
                  </a>
                </li>
              </ul>
            </div>

            <div className="w-full md:w-1/2">
              <h5 className="text-gray-600 text-lg font-semibold ">Support</h5>
              <ul className="list-none">
                <li className="pt-1">
                  <a
                    href="javascript:void(0);"
                    className="text-white text-sm font-semibold duration-150 hover:text-blue-700 hover:text-[15px]"
                  >
                    Contact us
                  </a>
                </li>
                <li className="pt-1">
                  <a
                    href="javascript:void(0);"
                    className="text-white text-sm font-semibold duration-150 hover:text-blue-700 hover:text-[15px]"
                  >
                    FAQs
                  </a>
                </li>
                <li className="pt-1">
                  <a
                    href="javascript:void(0);"
                    className="text-white text-sm font-semibold duration-150 hover:text-blue-700 hover:text-[15px]"
                  >
                    Shopping info
                  </a>
                </li>
                <li className="pt-1">
                  <a
                    href="javascript:void(0);"
                    className="text-white text-sm font-semibold duration-150 hover:text-blue-700 hover:text-[15px]"
                  >
                    Features
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <hr className="border-gray-400 m-2" />

          <div className="text-center">
            <p className="text-gray-600 font-semibold text-sm">
              Copyright &copy; 2020 React Rock Star by ABC Co.,Ltd
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
