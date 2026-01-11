// import { button } from "@material-tailwind/react";
import { useEffect, useState } from "react";

export default function Categories() {
  const [index, setIndex] = useState(0);

  const slides = [
    {
      image:
        "/src/assets/categories/ParacetamolTablets500-removebg-preview.png",
      title: "Paracetamol Tablets",
      description: "Effective pain relief and fever reducer.",
      butt: "Get Started ->",
      buy: "Buy 🛒",
    },
    {
      image: "/src/assets/categories/stethoscope-removebg-preview.png",
      title: "Stethoscope",
      description: "Essential tool for medical diagnosis.",
      butt: "Get Started ->",
      buy: "Buy 🛒",
    },
    {
      image: "/src/assets/categories/AWaiYar-removebg-preview.png",
      title: "A Wai Yar",
      description: "Trusted local pharmaceutical brand.",
      butt: "Get Started ->",
      buy: "Buy 🛒",
    },
    {
      image: "/src/assets/categories/HmanCho-removebg-preview.png",
      title: "Hman Cho",
      description: "Quality healthcare accessories.",
      butt: "Get Started ->",
      buy: "Buy 🛒",
    },
  ];

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      3000
    );
    return () => clearInterval(id);
  }, [slides.length]);

  return (
    <div className="relative w-full max-w-8xl mx-auto bg-gray-100 ">
      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 items-center">
        {/* Text left */}
        <div className="p-8 text-left">
          <h3 className="text-2xl font-bold text-gray-800 mb-3 text-center">
            {slides[index].title}
          </h3>
          <p className="text-gray-600 text-base leading-relaxed text-center">
            {slides[index].description}
          </p>
          <button className="text-gray-600 font-bold leading-relaxed text-center border-0 rounded-4xl p-2 lg:ml-58 mt-2 md:ml-10 bg-blue-500 shadow-xl hover:bg-white">
            {slides[index].butt}
          </button>
          <button className="text-gray-600 font-bold leading-relaxed text-center border-0 rounded-4xl p-2 ml-6 mt-2 bg-gray-300 shadow-xl hover:bg-amber-400">
            {slides[index].buy}
          </button>
        </div>

        {/* Image right */}
        <div className="flex justify-center items-center p-12 ]">
          <img
            src={slides[index].image}
            alt={slides[index].title}
            className="w-64 h-64 object-contain"
          />
        </div>
      </div>

      {/* Navigation buttons */}
      {/* <div className="absolute left-4 right-4 top-1/2 flex -translate-y-1/2 justify-between">
        <button
          className="btn btn-circle bg-white/80 hover:bg-white shadow-md"
          onClick={() =>
            setIndex((i) => (i - 1 + slides.length) % slides.length)
          }
        >
          ❮
        </button>
        <button
          className="btn btn-circle bg-white/80 hover:bg-white shadow-md"
          onClick={() => setIndex((i) => (i + 1) % slides.length)}
        >
          ❯
        </button>
      </div> */}
    </div>
  );
}
