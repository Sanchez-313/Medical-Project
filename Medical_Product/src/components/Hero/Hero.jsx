import React from "react";
// Assuming you rename your asset or use a medical-themed image
import MedicalSupplies from "../../assets/Engmedicines/MedicineSupply.png"; 
import Button from "../Button/Button";

const Hero = () => {
  return (
    <section>
      <div className="min-h-screen max-w-[1400px] mx-auto px-10 flex md:flex-row flex-col items-center md:pt-25 pt-35">
        {/* Hero Content */}
        <div className="flex-1">
          <span className="bg-blue-100 text-blue-600 text-lg px-5 py-2 rounded-full font-medium">
            Trusted Healthcare Solutions
          </span>
          <h1 className="md:text-7xl/20 text-5xl/14 font-bold mt-4">
            Reliable <span className="text-blue-600">Medical</span> &{" "}
            <span className="text-blue-600">Pharmacy</span> Inventory System
          </h1>
          <p className="text-zinc-600 md:text-lg text-md max-w-[530px] mt-5 mb-10">
            Streamline your healthcare management with our integrated system for 
            English and Myanmar medicines, surgical equipment, and real-time stock tracking.
          </p>
          <div className="flex gap-4">
            <Button content="Manage Inventory" />
            
          </div>
        </div>
        
        {/* Hero Image */}
        <div className="flex-1 brightness-105 mt-10 md:mt-0 hover:scale-105">
          <img 
            src={MedicalSupplies} 
            alt="Medical Inventory and Equipment" 
            className="w-full h-auto drop-shadow-2xl"
          />
          
        </div>
      </div>
    </section>
  );
};

export default Hero;