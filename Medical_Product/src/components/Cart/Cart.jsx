import React from 'react'
import { FaMinus, FaPlus, FaTrash } from 'react-icons/fa'

const Cart = ({ activePannel, handleClose, items = [], onRemove, onUpdateQty, getProductStock }) => {
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const isOpen = activePannel === 'cart';
  return (
    <div className={`flex flex-col justify-between gap-5 fixed top-0 right-0 bottom-0 z-[220] w-[400px] border-l border-zinc-300 py-7 transform transition-transform duration-300 bg-white
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Heading */}
        <div className='px-10'>
            <h3 className="text-3xl font-bold text-zinc-800 text-center">Your Cart</h3>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-10 py-12 text-center text-zinc-500">
              Your cart is empty.
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 bg-white px-5 py-3 border-y border-zinc-200">
                {/* Cart Image */}
                <div className="w-16 h-16">
                  <img src={item.image} className='w-full h-full object-contain' alt={item.name} />
                </div>

                {/* Product Detail */}
                <div className="flex-1">
                  <div className='flex justify-between items-center'>
                    <h4 className='font-semibold text-zinc-800 text-sm'>{item.name}</h4>
                    <button
                      onClick={() => onRemove?.(item.id)}
                      className='w-8 h-8 bg-red-600 rounded-full text-white flex justify-center items-center'
                    >
                      <FaTrash />
                    </button>
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    <span>{item.price.toLocaleString()} MMK</span>
                    <div className='flex gap-2 items-center'>
                      <button
                        onClick={() => onUpdateQty?.(item.id, item.quantity - 1)}
                        className='w-7 h-7 bg-blue-600 rounded-full text-white flex justify-center items-center text-[14px] cursor-pointer active:bg-blue-700'
                      >
                        <FaMinus />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        disabled={getProductStock?.(item.id) === 0}
                        onClick={() => onUpdateQty?.(item.id, item.quantity + 1)}
                        className='w-7 h-7 bg-blue-600 rounded-full text-white flex justify-center items-center text-[14px] cursor-pointer active:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300'
                      >
                        <FaPlus />
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Total */}
        <div className="px-10 border-y border-zinc-300">
            <div className="flex justify-between pt-2">
                <span className="text-zinc-800">Subtotal</span>
                <span className="text-zinc-800">{subtotal.toLocaleString()} MMK</span>
            </div>
            <div className="flex justify-between py-2">
                <span className="text-zinc-800">Shipping & Handlings</span>
                <span className="text-zinc-800">0 MMK</span>
            </div>
            <div className="flex justify-between py-2 border-t border-zinc-300">
                <span className="text-lg text-blue-600 font-bold">Order Total</span>
                <span className="text-lg text-blue-600 font-bold">{subtotal.toLocaleString()} MMK</span>
            </div>
        </div>

        {/* Buttons */}
        <div className='flex gap-x-2 px-10'>
            <button className='bg-blue-600 text-white flex-1 h-[7vh] cursor-pointer active:bg-blue-700' onClick={handleClose}>Close</button>
            <button className='bg-blue-600 text-white flex-1 h-[7vh] cursor-pointer active:bg-blue-700'>CheckOut</button>
        </div>
    </div>
  )
}

export default Cart
