export default function Card() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 p-6">
        <div className="flex flex-col w-full max-w-sm bg-gray-200 p-3 border border-default rounded-base shadow-xs">
          <a href="#">
            <img
              className="rounded-base mb-4 w-full"
              src="./images/ParacetamolTablets500.webp"
              alt="product image"
            />
          </a>
          <div>
            <div className="flex items-center space-x-3 mb-6 font-bold text-2xl text-indigo-700">
              Paracetamol
            </div>
            <a href="#">
              <h5 className="text-xl text-heading font-semibold tracking-tight">
                ParacetamolTablets500 (for illness)
              </h5>
            </a>
            <div className="flex items-center justify-between mt-6">
              <span className="text-3xl text-amber-500 font-extrabold">
                990 Kyats
              </span>
              <button
                type="button"
                className="text-white bg-indigo-600 hover:animate-bounce hover:bg-indigo-800 box-border border border-dashed shadow-xs font-medium leading-5 rounded-base text-bold px-3 py-2 focus:outline-none"
              >
                <span className="w-4 text-amber-400">
                  <i className="fa fa-shopping-cart" aria-hidden="true"></i>
                </span>
                Add to cart
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col w-full max-w-sm bg-gray-200 p-3 border border-default rounded-base shadow-xs">
          <a href="#">
            <img
              className="rounded-base mb-4 w-full hover:animate-pulse"
              src="./images/ParacetamolTablets500.webp"
              alt="product image"
            />
          </a>
          <div>
            <div className="flex items-center space-x-3 mb-6 font-bold text-2xl text-indigo-700">
              Paracetamol
            </div>
            <a href="#">
              <h5 className="text-xl text-heading font-semibold tracking-tight">
                ParacetamolTablets500 (for illness)
              </h5>
            </a>
            <div className="flex items-center justify-between mt-6">
              <span className="text-3xl text-amber-500 font-extrabold">
                990 Kyats
              </span>
              <button
                type="button"
                className="text-white bg-indigo-600 hover:animate-bounce hover:bg-indigo-800 box-border border border-dashed shadow-xs font-medium leading-5 rounded-base text-bold px-3 py-2 focus:outline-none"
              >
                <span className="w-4 text-amber-400">
                  <i className="fa fa-shopping-cart" aria-hidden="true"></i>
                </span>
                Add to cart
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col w-full max-w-sm bg-gray-200 p-3 border border-default rounded-base shadow-xs">
          <a href="#">
            <img
              className="rounded-base mb-4 w-full"
              src="./images/ParacetamolTablets500.webp"
              alt="product image"
            />
          </a>
          <div>
            <div className="flex items-center space-x-3 mb-6 font-bold text-2xl text-indigo-700">
              Paracetamol
            </div>
            <a href="#">
              <h5 className="text-xl text-heading font-semibold tracking-tight">
                ParacetamolTablets500 (for illness)
              </h5>
            </a>
            <div className="flex items-center justify-between mt-6">
              <span className="text-3xl text-amber-500 font-extrabold">
                990 Kyats
              </span>
              <button
                type="button"
                className="text-white bg-indigo-600 hover:animate-bounce hover:bg-indigo-800 box-border border border-dashed shadow-xs font-medium leading-5 rounded-base text-bold px-3 py-2 focus:outline-none"
              >
                <span className="w-4 text-amber-400">
                  <i className="fa fa-shopping-cart" aria-hidden="true"></i>
                </span>
                Add to cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
