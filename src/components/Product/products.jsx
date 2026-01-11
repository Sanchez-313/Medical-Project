import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart,
  faStar,
  faCartShopping,
} from "@fortawesome/free-solid-svg-icons";

export default function Products() {
  return (
    <div>
      <h1 className="text-center text-3xl font-extrabold text-indigo-500 pt-1">Medical</h1>
      <h2 className="text-center text-sm text-gray-900 pb-2">Effective pain relief and fever reducer</h2>
      <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-2 gap-y-4 mr-4 ml-4">
        <div className=" bg-natural-500 p-4 mx-3 border-0 rounded-lg shadow-lg">
          <div className="bg-natural-200">
            <a href="#">
              <FontAwesomeIcon
                icon={faHeart}
                className="text-red-500 absolute m-2 md:ml-66 lg:ml-70"
              />
              <span className="absolute font-bold text-blue-400 bg-gray-50 border border-2 p-1 shadow-2xl rounded-4xl m-2">
                1400MMK
              </span>
              <img
                className="rounded-2xl w-xs h-[200px] mb-4 duration-300 hover:scale-103 hover:brightness-103"
                src="/src/assets/medicine/Engmedicines/ParacetamolTablets500.webp"
                alt="ParacetamolTablets500"
              />
            </a>
          </div>
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                <FontAwesomeIcon
                  icon={faStar}
                  className="w-5 h-5 text-yellow-500"
                />
                <FontAwesomeIcon
                  icon={faStar}
                  className="w-5 h-5 text-yellow-500"
                />
                <FontAwesomeIcon
                  icon={faStar}
                  className="w-5 h-5 text-yellow-500"
                />
                <FontAwesomeIcon
                  icon={faStar}
                  className="w-5 h-5 text-yellow-500"
                />
                <span className="relative inline-block w-5 h-5">
                  <FontAwesomeIcon
                    icon={faStar}
                    className="absolute top-1 left-0 w-5 h-5 text-gray-300"
                  />
                  <span className="absolute top-0 left-0 w-1/2 h-full overflow-hidden">
                    <FontAwesomeIcon
                      icon={faStar}
                      className="w-5 h-5 text-yellow-500"
                    />
                  </span>
                </span>
              </div>
              <span className="bg-white-900 border border-1 text-black text-xs font-bold px-1.5 py-0.5 rounded-lg">
                4.5 out of 5
              </span>
            </div>
            <h1 className="text-indigo-500 text-xl py-1 font-extrabold">
              Paracetamol Tablet(500mg)
            </h1>
            <a href="#">
              <h5 className="text-xl text-heading font-semibold tracking-tight">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </h5>
            </a>
            <div className="flex items-center justify-between mt-6">
              <button
                type="button"
                className="max-w-md w-full text-white text-center bg-indigo-600 hover:animate-bounce hover:bg-indigo-800 box-border border border-dashed shadow-2xl font-bold leading-5 rounded-base text-bold px-3 py-2 focus:outline-none"
              >
                <FontAwesomeIcon
                  icon={faCartShopping}
                  className="w-4 h-4 me-1.5"
                />
                Add to cart
              </button>
            </div>
          </div>
        </div>

        <div className=" bg-natural-500 p-4 mx-3 border-0 rounded-lg shadow-lg">
          <div className="bg-natural-200">
            <a href="#">
              <FontAwesomeIcon
                icon={faHeart}
                className="text-red-500 absolute m-2 md:ml-66 lg:ml-70"
              />
              <span className="absolute font-bold text-blue-400 bg-gray-100 border border-2 p-1 shadow-2xl rounded-4xl m-2">
                1400MMK
              </span>
              <img
                className="rounded-2xl w-xs h-[200px] mb-4 duration-300 hover:scale-103 hover:brightness-103"
                src="/src/assets/medicine/Engmedicines/Oramin-G.jpg"
                alt="Oramin-G"
              />
            </a>
          </div>
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                <FontAwesomeIcon
                  icon={faStar}
                  className="w-5 h-5 text-yellow-500"
                />
                <FontAwesomeIcon
                  icon={faStar}
                  className="w-5 h-5 text-yellow-500"
                />
                <FontAwesomeIcon
                  icon={faStar}
                  className="w-5 h-5 text-yellow-500"
                />
                <FontAwesomeIcon
                  icon={faStar}
                  className="w-5 h-5 text-yellow-500"
                />
                <span className="relative inline-block w-5 h-5">
                  <FontAwesomeIcon
                    icon={faStar}
                    className="absolute top-1 left-0 w-5 h-5 text-gray-300"
                  />
                  <span className="absolute top-0 left-0 w-1/2 h-full overflow-hidden">
                    <FontAwesomeIcon
                      icon={faStar}
                      className="w-5 h-5 text-yellow-500"
                    />
                  </span>
                </span>
              </div>
              <span className="bg-white-900 border border-1 text-black text-xs font-bold px-1.5 py-0.5 rounded-lg">
                4.5 out of 5
              </span>
            </div>
            <h1 className="text-indigo-500 text-xl py-1 font-extrabold">
              Oramin-G(30 Soft Caps)
            </h1>
            <a href="#">
              <h5 className="text-xl text-heading font-semibold tracking-tight">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </h5>
            </a>
            <div className="flex items-center justify-between mt-6">
              <button
                type="button"
                className="max-w-md w-full text-white text-center bg-indigo-600 hover:animate-bounce hover:bg-indigo-800 box-border border border-dashed shadow-2xl font-bold leading-5 rounded-base text-bold px-3 py-2 focus:outline-none"
              >
                <FontAwesomeIcon
                  icon={faCartShopping}
                  className="w-4 h-4 me-1.5"
                />
                Add to cart
              </button>
            </div>
          </div>
        </div>

        <div className=" bg-natural-500 p-4 mx-3 border-0 rounded-lg shadow-lg">
          <div className="bg-natural-200">
            <a href="#">
              <FontAwesomeIcon
                icon={faHeart}
                className="text-red-500 absolute m-2 md:ml-66 lg:ml-70"
              />
              <span className="absolute font-bold text-blue-400 bg-gray-100 border border-2 p-1 shadow-2xl rounded-4xl m-2">
                1400MMK
              </span>
              <img
                className="rounded-2xl w-xs h-[200px] mb-4 duration-300 hover:scale-103 hover:brightness-103"
                src="/src/assets/medicine/Engmedicines/Syrup.jpg"
                alt="Syrup"
              />
            </a>
          </div>
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                <FontAwesomeIcon
                  icon={faStar}
                  className="w-5 h-5 text-yellow-500"
                />
                <FontAwesomeIcon
                  icon={faStar}
                  className="w-5 h-5 text-yellow-500"
                />
                <FontAwesomeIcon
                  icon={faStar}
                  className="w-5 h-5 text-yellow-500"
                />
                <FontAwesomeIcon
                  icon={faStar}
                  className="w-5 h-5 text-yellow-500"
                />
                <span className="relative inline-block w-5 h-5">
                  <FontAwesomeIcon
                    icon={faStar}
                    className="absolute top-1 left-0 w-5 h-5 text-gray-300"
                  />
                  <span className="absolute top-0 left-0 w-1/2 h-full overflow-hidden">
                    <FontAwesomeIcon
                      icon={faStar}
                      className="w-5 h-5 text-yellow-500"
                    />
                  </span>
                </span>
              </div>
              <span className="bg-white-900 border border-1 text-black text-xs font-bold px-1.5 py-0.5 rounded-lg">
                4.5 out of 5
              </span>
            </div>
            <h1 className="text-indigo-500 text-xl py-1 font-extrabold">
              IVYTUS(Cough Syrup)
            </h1>
            <a href="#">
              <h5 className="text-xl text-heading font-semibold tracking-tight">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </h5>
            </a>
            <div className="flex items-center justify-between mt-6">
              <button
                type="button"
                className="max-w-md w-full text-white text-center bg-indigo-600 hover:animate-bounce hover:bg-indigo-800 box-border border border-dashed shadow-2xl font-bold leading-5 rounded-base text-bold px-3 py-2 focus:outline-none"
              >
                <FontAwesomeIcon
                  icon={faCartShopping}
                  className="w-4 h-4 me-1.5"
                />
                Add to cart
              </button>
            </div>
          </div>
        </div>

        <div className=" bg-natural-500 p-4 mx-3 border-0 rounded-lg shadow-lg">
          <div className="bg-natural-200">
            <a href="#">
              <FontAwesomeIcon
                icon={faHeart}
                className="text-red-500 absolute m-2 md:ml-66 lg:ml-70"
              />
              <span className="absolute font-bold text-blue-400 bg-gray-50 border border-2 p-1 shadow-2xl rounded-4xl m-2">
                900MMK
              </span>
              <img
                className="rounded-2xl w-xs h-[200px] mb-4 duration-300 hover:scale-103 hover:brightness-103"
                src="/src/assets/medicine/Myamedicines/AWaiYar.webp"
                alt="AWaiYar"
              />
            </a>
          </div>
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                <FontAwesomeIcon
                  icon={faStar}
                  className="w-5 h-5 text-yellow-500"
                />
                <FontAwesomeIcon
                  icon={faStar}
                  className="w-5 h-5 text-yellow-500"
                />
                <FontAwesomeIcon
                  icon={faStar}
                  className="w-5 h-5 text-yellow-500"
                />
                <FontAwesomeIcon
                  icon={faStar}
                  className="w-5 h-5 text-yellow-500"
                />
                <span className="relative inline-block w-5 h-5">
                  <FontAwesomeIcon
                    icon={faStar}
                    className="absolute top-1 left-0 w-5 h-5 text-gray-300"
                  />
                  <span className="absolute top-0 left-0 w-1/2 h-full overflow-hidden">
                    <FontAwesomeIcon
                      icon={faStar}
                      className="w-5 h-5 text-yellow-500"
                    />
                  </span>
                </span>
              </div>
              <span className="bg-white-900 border border-1 text-black text-xs font-bold px-1.5 py-0.5 rounded-lg">
                4.5 out of 5
              </span>
            </div>
            <h1 className="text-indigo-500 text-xl py-1 font-extrabold">
              AWaiYar (Hello)
            </h1>
            <a href="#">
              <h5 className="text-xl text-heading font-semibold tracking-tight">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </h5>
            </a>
            <div className="flex items-center justify-between mt-6">
              <button
                type="button"
                className="max-w-md w-full text-white text-center bg-indigo-600 hover:animate-bounce hover:bg-indigo-800 box-border border border-dashed shadow-2xl font-bold leading-5 rounded-base text-bold px-3 py-2 focus:outline-none"
              >
                <FontAwesomeIcon
                  icon={faCartShopping}
                  className="w-4 h-4 me-1.5"
                />
                Add to cart
              </button>
            </div>
          </div>
        </div>

        {/* <div className="w-full max-w-md bg-natural-500 p-4 mx-12 border-0 rounded-lg shadow-lg">
        <div className="bg-natural">
          <a href="#">
            <FontAwesomeIcon
              icon={faHeart}
              className="text-red-500 absolute m-2 ml-72"
            /><span className="absolute font-bold text-amber-600 bg-gray-50 border border-2 p-1 shadow-2xl rounded-4xl m-2">1400MMK</span>
            <img
              className="rounded-2xl w-xs h-[200px] mb-4 hover:scale-103 hover:brightness-103"
              src="/src/assets/medicine/Engmedicines/ParacetamolTablets500.webp"
              alt="ParacetamolTablets500"
            />
          </a>
        </div>
        <div>
          <div className="flex items-center space-x-3 mb-6">
            <div className="flex items-center space-x-1 rtl:space-x-reverse">
              <FontAwesomeIcon
                icon={faStar}
                className="w-5 h-5 text-yellow-500"
              />
              <FontAwesomeIcon
                icon={faStar}
                className="w-5 h-5 text-yellow-500"
              />
              <FontAwesomeIcon
                icon={faStar}
                className="w-5 h-5 text-yellow-500"
              />
              <FontAwesomeIcon
                icon={faStar}
                className="w-5 h-5 text-yellow-500"
              />
              <span className="relative inline-block w-5 h-5">
                <FontAwesomeIcon
                  icon={faStar}
                  className="absolute top-1 left-0 w-5 h-5 text-gray-300"
                />
                <span className="absolute top-0 left-0 w-1/2 h-full overflow-hidden">
                  <FontAwesomeIcon
                    icon={faStar}
                    className="w-5 h-5 text-yellow-500"
                  />
                </span>
              </span>
            </div>
            <span className="bg-white-900 border border-1 text-black text-xs font-bold px-1.5 py-0.5 rounded-lg">
              4.5 out of 5
            </span>
          </div>
          <h1 className="text-indigo-500 text-xl py-1 font-extrabold">
            Paracetamol Tablet(500mg)
          </h1>
          <a href="#">
            <h5 className="text-xl text-heading font-semibold tracking-tight">
              Lorem Ipsum is simply dummy text of the printing and typesetting
              industry. 
            </h5>
          </a>
          <div className="flex items-center justify-between mt-6">
            <button
              type="button"
              className="max-w-md w-full text-white text-center bg-indigo-600 hover:animate-bounce hover:bg-indigo-800 box-border border border-dashed shadow-2xl font-bold leading-5 rounded-base text-bold px-3 py-2 focus:outline-none"
            >
              <FontAwesomeIcon
                icon={faCartShopping}
                className="w-4 h-4 me-1.5"
              />
              Add to cart
            </button>
          </div>
        </div>
         </div> */}
      </div>
    </div>
  );
}
