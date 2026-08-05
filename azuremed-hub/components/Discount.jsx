import React from 'react'
import Button from '../Button/Button'
// Ensure you have a medical-themed background image
import MedBanner from '../../assets/Engmedicines/Hero.png' 

const Discount = () => {
  return (
    <section 
      className="bg-blue-50 bg-no-repeat bg-right bg-contain border-y border-blue-100" 
      style={{backgroundImage: `url(${MedBanner})`}}
    >
        <div className="md:bg-transparent bg-blue-50 flex md:flex-row flex-col max-w-[1400px] mx-auto px-10 py-16">
            {/* Discount Percentage with Medical Blue */}
            <span className="md:text-9xl text-6xl text-blue-600 font-extrabold transform md:-rotate-90 h-fit md:self-center drop-shadow-sm">
                15%
            </span>
            
            <div className="max-w-[700px] md:ml-[-50px]">
                <h3 className="md:text-7xl text-4xl text-zinc-800 font-bold mt-2">
                    Healthcare <span className="text-blue-600">Savings</span> Plan
                </h3>
                <p className="text-zinc-600 my-6 text-lg leading-relaxed">
                    Get an exclusive discount on your first pharmacy order. We provide 
                    authentic English and Myanmar medicines with professional pharmaceutical care.
                </p>
                <Button content='Claim Your Discount' />
                
                <p className="text-xs text-zinc-400 mt-4 uppercase tracking-widest">
                    * Terms and conditions apply. Licensed prescriptions required where applicable.
                </p>
            </div>
        </div>
    </section>
  )
}

export default Discount;