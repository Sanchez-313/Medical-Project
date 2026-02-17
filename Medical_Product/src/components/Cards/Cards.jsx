import React, { useState } from 'react';
import { FaHeart, FaPlus } from "react-icons/fa6";
import ProductView from '../ProductView/ProductView'; 

const Cards = ({ image, name, price, category, description }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className='bg-gray-100 p-5 rounded-2xl relative group hover:shadow-2xl transition-all duration-500 border border-slate-100'>
        {/* Actions */}
        <div className='flex justify-between items-start'>
          <button className='text-2xl text-slate-200 hover:text-red-500 transition-colors'>
            <FaHeart />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className='bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 hover:rotate-90 transition-all duration-300 shadow-lg shadow-blue-200'
          >
            <FaPlus />
          </button>
        </div>

        {/* Product Image */}
        <div className='w-full h-40 mt-4 cursor-pointer' onClick={() => setIsModalOpen(true)}>
          <img src={image} alt={name} className="w-full h-full mx-auto object-contain transition-transform group-hover:scale-110" />
        </div>

        {/* Detail */}
        <div className='text-center mt-6'>
          <p className='text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1'>{category}</p>
          <h3 className='text-lg font-bold text-slate-800 truncate'>{name}</h3>
          <p className='text-xl font-black text-slate-900 mt-2'>
            {price.toLocaleString()} <span className='text-xs font-medium'>MMK</span>
          </p>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="mt-4 w-full py-3 bg-gradient-to-l from-indigo-300 to-indigo-400 text-slate-600 font-bold rounded-xl hover:bg-gradient-to-r hover:translate-1 hover:text-white transition-all border border-slate-100"
          >
            Quick View
          </button>
        </div>
      </div>

      <ProductView 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        product={{ image, name, price, category, description }}
      />
    </>
  );
};

export default Cards;