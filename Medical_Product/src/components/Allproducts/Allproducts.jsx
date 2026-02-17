import React from 'react'
import CategoryPage from '../CategoryPage/CategoryPage'
import BgAllProducts from '../../assets/Engmedicines/EnglishMedicine.png'
const Fruits = () => {
  return (
    <div>
        <CategoryPage title="All Products" bgImage={BgAllProducts} categories={['All']} />
    </div>
  )
}

export default Fruits