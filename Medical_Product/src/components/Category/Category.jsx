import React from "react";
import Heading from "../Heading/Heading";
import EngMedicine from "../../assets/Engmedicines/EnglishMedicine.png";
import MyanmarMedicine from "../../assets/Myamedicines/MyanmarMedicine.png"; // Assuming new path
import MedicalEquip from "../../assets/Equipments/medical-equipment-and-medicine-design-vector-removebg-preview.png"; // Assuming new path
import { Link } from "react-router-dom";

const Category = (onClose) => {
  const renderCards = category.map((card) => {
    return (
      <div className="flex-1 basis-[300px]" key={card.id}>
        <div className="w-full min-h-[30vh] relative -mb-10 z-10">
          {/* Ensure images are isolated and clear */}
          <img
            src={card.image}
            alt={card.title}
            
            className="absolute bottom-0 left-1/2 -translate-x-1/2 max-h-[200px] object-contain"
          />
        </div>

        <div className="bg-zinc-100 pt-17 p-8 rounded-xl border border-zinc-200">
          <h3 className="text-zinc-800 text-2xl font-bold">{card.title}</h3>
          <p className="text-zinc-600 mt-3 mb-9 line-clamp-2">
            {card.description}
          </p>
          <Link
            to={card.path}
            onClick={() => {
              onClose();
              window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
            }}
            className="inline-block bg-gradient-to-b from-blue-500 to-blue-600 text-white px-8 py-3 rounded-lg md:text-lg text-md hover:scale-105 hover:from-blue-600 hover:to-blue-700 transition-all duration-300 cursor-pointer shadow-md"
          >
            View Products
          </Link>
        </div>
      </div>
    );
  });

  return (
    <section>
      <div className="max-w-[1400px] mx-auto px-10 py-20">
        <Heading highlight="Browse" heading="Medical Categories" />

        {/* Category Card Container */}
        <div className="flex flex-wrap gap-10 mt-20">{renderCards}</div>
      </div>
    </section>
  );
};

export default Category;

const category = [
  {
    id: 1,
    title: "English Medicine",
    description:
      "Quality controlled pharmaceuticals, antibiotics, and daily healthcare tablets.",
    image: EngMedicine,
    path: "/EnglishMedicine",
  },
  {
    id: 2,
    title: "Myanmar Medicine",
    description:
      "Authentic traditional Burmese herbal remedies and natural supplements.",
    image: MyanmarMedicine,
    path: "/MyanmarMedicine",
  },
  {
    id: 3,
    title: "Medical Equipment",
    description:
      "Professional stethoscopes, thermometers, and diagnostic tools for clinics.",
    image: MedicalEquip,
    path: "/Equipment",
  },
];
