import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FaHeart } from "react-icons/fa6";
import ProductView from '../ProductView/ProductView'; 

const Cards = ({ id, image, name, price, category, stock, description, onAddToCart }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const outletContext = useOutletContext() || {};
  const toggleFavorite = outletContext.toggleFavorite;
  const isFavorite = outletContext.isFavorite;
  const getProductStock = outletContext.getProductStock;

  const stockFromStore = getProductStock?.(id);
  const normalizedPropStock = Number.isFinite(Number(stock)) ? Number(stock) : null;
  const displayStock = Number.isFinite(Number(stockFromStore)) ? Number(stockFromStore) : normalizedPropStock;
  const isOutOfStock = displayStock !== null && displayStock <= 0;
  const favoriteActive = Boolean(isFavorite?.(id));

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    toggleFavorite?.({ id, image, name, price, category, stock, description });
  };

  return (
    <>
      <div className='bg-gray-100 p-5 rounded-2xl relative overflow-hidden group hover:shadow-2xl transition-all duration-500 border border-slate-100'>
        {isOutOfStock ? (
          <div className='pointer-events-none absolute left-3 top-3 z-20 whitespace-nowrap rounded-md bg-red-600 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.03em] text-white shadow-lg'>
            OUT OF STOCK
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleToggleFavorite}
          className={`absolute right-4 top-4 z-20 text-2xl transition-colors ${
            favoriteActive ? 'text-red-500' : 'text-slate-300 hover:text-red-500'
          }`}
          aria-label={favoriteActive ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <FaHeart />
        </button>

        {/* Product Image */}
        <div className='relative z-10 w-full h-40 mt-10 cursor-pointer' onClick={() => setIsModalOpen(true)}>
          <img src={image} alt={name} className="w-full h-full mx-auto object-contain transition-transform group-hover:scale-110" />
        </div>

        {/* Detail */}
        <div className='relative z-10 text-center mt-6'>
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
        onAddToCart={onAddToCart}
        product={{ id, image, name, price, category, stock, description }}
      />
    </>
  );
};

export default Cards;
