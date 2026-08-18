import React from "react";
import Heading from "../Heading/Heading";
import { FaStethoscope, FaFlask, FaShieldVirus, FaCheckDouble } from "react-icons/fa6";
import ValueImg from "../../assets/Engmedicines/EngMedicine.png";

const Values = () => {
  const leftValues = value.slice(0, 2).map((item) => {
    return (
      <div key={item.id} className="flex md:flex-row-reverse items-center gap-7">
        <div>
          <span className="flex justify-center items-center text-3xl text-white bg-gradient-to-b from-cyan-500 to-blue-600 w-16 h-16 rounded-full shadow-lg">
            {item.icon}
          </span>
        </div>

        <div className="md:text-right">
          <h3 className="text-zinc-800 text-2xl font-bold">{item.title}</h3>
          <p className="text-zinc-600 mt-2 text-sm md:text-base">{item.para}</p>
        </div>
      </div>
    );
  });

  const rightValues = value.slice(2).map((item) => {
    return (
      <div key={item.id} className="flex items-center gap-7">
        <div>
          <span className="flex justify-center items-center text-3xl text-white bg-gradient-to-b from-cyan-500 to-blue-600 w-16 h-16 rounded-full shadow-lg">
            {item.icon}
          </span>
        </div>

        <div>
          <h3 className="text-zinc-800 text-2xl font-bold">{item.title}</h3>
          <p className="text-zinc-600 mt-2 text-sm md:text-base">{item.para}</p>
        </div>
      </div>
    );
  });

  return (
    <section className="bg-white">
      <div className="max-w-[1400px] mx-auto px-10 py-20">
        <Heading highlight="Core" heading="Medical Values" />

        <div className="flex md:flex-row flex-col gap-15 md:gap-10 mt-15 items-center">
          {/* Left values */}
          <div className="md:w-1/3 flex flex-col gap-46">{leftValues}</div>

          {/* Center Image */}
          <div className="md:w-1/3 flex justify-center">
            <img 
              src={ValueImg} 
              alt="Medical Inventory" 
              className="max-h-[450px] w-full object-contain drop-shadow-2xl hover:transform-3d hover:hue-rotate-10" 
            />
          </div>

          {/* Right Values */}
          <div className="md:w-1/3 flex flex-col gap-46">{rightValues}</div>
        </div>
      </div>
    </section>
  );
};

export default Values;

const value = [
  {
    id: 1,
    title: "Certified Quality",
    para: "All English and Myanmar medicines undergo strict quality control and FDA inspections.",
    icon: <FaCheckDouble />,
  },
  {
    id: 2,
    title: "Expert Support",
    para: "Our pharmacists are available to provide professional consultation for your prescriptions.",
    icon: <FaStethoscope />,
  },
  {
    id: 3,
    title: "Safety First",
    para: "Secure packaging and temperature-controlled storage ensure your medicine remains effective.",
    icon: <FaShieldVirus />,
  },
  {
    id: 4,
    title: "Authentic Herbal",
    para: "Traditional Myanmar medicines sourced directly from trusted, licensed herbal manufacturers.",
    icon: <FaFlask />,
  },
];