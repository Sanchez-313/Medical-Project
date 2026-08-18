import React from 'react'
import { FaMinus, FaPlus, FaTrash } from 'react-icons/fa'

const Wishlist = ({
  activePannel,
  handleClose,
  items = [],
  onRemove,
  onClear,
  onAddToCart,
  onUpdateQty,
  getProductStock,
}) => {
  const isOpen = activePannel === 'wishlist'
  return (
    <div className={`flex flex-col justify-between gap-5 fixed top-0 right-0 bottom-0 z-[220] w-[400px] border-l border-zinc-300 py-7 transform transition-transform duration-300 bg-white
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            {/* Heading */}
            <div className='px-10'>
                <h3 className="text-3xl font-bold text-zinc-800 text-center">Your Wishlist</h3>
            </div>
    
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="px-10 py-12 text-center text-zinc-500">
                    No favorite items yet.
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 bg-white px-5 py-3 border-y border-zinc-200">
                      <div className="w-16 h-16">
                        <img src={item.image} className="w-full h-full object-contain" alt={item.name} />
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-zinc-800 text-sm">{item.name}</h4>
                          <button
                            type="button"
                            onClick={() => onRemove?.(item.id)}
                            className="w-8 h-8 bg-red-600 rounded-full text-white flex justify-center items-center"
                          >
                            <FaTrash />
                          </button>
                        </div>

                        <div className="flex justify-between items-center mt-2">
                          <span>{Number(item.price || 0).toLocaleString()} MMK</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onUpdateQty?.(item.id, (item.quantity || 1) - 1)}
                              className="w-7 h-7 bg-blue-600 rounded-full text-white flex justify-center items-center text-[14px] cursor-pointer active:bg-blue-700"
                            >
                              <FaMinus />
                            </button>
                            <span className="min-w-[20px] text-center font-semibold">
                              {item.quantity || 1}
                            </span>
                            <button
                              type="button"
                              disabled={
                                getProductStock?.(item.id) !== null &&
                                Number(item.quantity || 1) >= Number(getProductStock?.(item.id))
                              }
                              onClick={() => onUpdateQty?.(item.id, (item.quantity || 1) + 1)}
                              className="w-7 h-7 bg-blue-600 rounded-full text-white flex justify-center items-center text-[14px] cursor-pointer active:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                              <FaPlus />
                            </button>
                            <button
                              type="button"
                              onClick={() => onAddToCart?.(item, item.quantity || 1)}
                              className="bg-blue-600 text-white text-sm px-4 py-1 rounded-full active:bg-blue-700 cursor-pointer"
                            >
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
            </div>
    
            {/* Buttons */}
            <div className='flex gap-x-2 px-10'>
                <button className='bg-blue-600 text-white flex-1 h-[7vh] cursor-pointer active:bg-blue-700' onClick={handleClose}>Close</button>
                <button
                  type="button"
                  onClick={() => onClear?.()}
                  disabled={items.length === 0}
                  className='bg-blue-600 text-white flex-1 h-[7vh] cursor-pointer active:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300'
                >
                  Clear All
                </button>
            </div>
        </div>
  )
}

export default Wishlist
