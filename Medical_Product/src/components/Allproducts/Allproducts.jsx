import React from 'react'
import { useOutletContext } from 'react-router-dom'
import CategoryPage from '../CategoryPage/CategoryPage'
import BgAllProducts from '../../assets/Engmedicines/EnglishMedicine.png'
const Fruits = () => {
  const { addToCart } = useOutletContext() || {}
  return (
    <div>
        <CategoryPage title="All Products" bgImage={BgAllProducts} categories={['All']} addToCart={addToCart} />
    </div>
  )
}

export default Fruits
