import Image from "next/image";
import { FaStethoscope, FaFlask, FaShieldVirus, FaCheckDouble } from "react-icons/fa6";
import Heading from "@/components/Heading";

/** Faithful port of Medical_Product/src/components/Values/Values.jsx. */
const VALUES = [
  { id: 1, title: "Certified Quality", para: "All English and Myanmar medicines undergo strict quality control and FDA inspections.", icon: <FaCheckDouble /> },
  { id: 2, title: "Expert Support", para: "Our pharmacists are available to provide professional consultation for your prescriptions.", icon: <FaStethoscope /> },
  { id: 3, title: "Safety First", para: "Secure packaging and temperature-controlled storage ensure your medicine remains effective.", icon: <FaShieldVirus /> },
  { id: 4, title: "Authentic Herbal", para: "Traditional Myanmar medicines sourced directly from trusted, licensed herbal manufacturers.", icon: <FaFlask /> },
];

export default function ValuesSection() {
  const leftValues = VALUES.slice(0, 2);
  const rightValues = VALUES.slice(2);

  return (
    <section className="bg-white">
      <div className="max-w-[1400px] mx-auto px-10 py-16">
        <Heading highlight="Core" heading="Medical Values" />

        <div className="flex md:flex-row flex-col gap-16 md:gap-10 mt-16 items-center">
          <div className="md:w-1/3 flex flex-col gap-24">
            {leftValues.map((item) => (
              <div key={item.id} className="flex md:flex-row-reverse items-center gap-7">
                <span className="flex justify-center items-center text-3xl text-white bg-gradient-to-b from-cyan-500 to-blue-600 w-16 h-16 rounded-full shadow-lg shrink-0">
                  {item.icon}
                </span>
                <div className="md:text-right">
                  <h3 className="text-zinc-800 text-2xl font-bold">{item.title}</h3>
                  <p className="text-zinc-600 mt-2 text-sm md:text-base">{item.para}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="md:w-1/3 flex justify-center">
            <div className="relative h-[350px] w-full max-h-[450px]">
              <Image
                src="/images/Engmedicines/EngMedicine.png"
                alt="Medical Inventory"
                fill
                className="object-contain drop-shadow-2xl"
              />
            </div>
          </div>

          <div className="md:w-1/3 flex flex-col gap-24">
            {rightValues.map((item) => (
              <div key={item.id} className="flex items-center gap-7">
                <span className="flex justify-center items-center text-3xl text-white bg-gradient-to-b from-cyan-500 to-blue-600 w-16 h-16 rounded-full shadow-lg shrink-0">
                  {item.icon}
                </span>
                <div>
                  <h3 className="text-zinc-800 text-2xl font-bold">{item.title}</h3>
                  <p className="text-zinc-600 mt-2 text-sm md:text-base">{item.para}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
