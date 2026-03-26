import React from 'react'
import { useOutletContext } from 'react-router-dom'
import CategoryPage from '../CategoryPage/CategoryPage'
import BgMyanmarMedicine from '../../assets/Myamedicines/MyanmarMedicine.png'
const MyanmarMedicine = () => {
  const { addToCart } = useOutletContext() || {}
  return (
    <div>
        <CategoryPage title="Myanmar Medicine" bgImage={BgMyanmarMedicine} categories={['MyanmarMedicine']} addToCart={addToCart} />
    </div>
  )
}

export default MyanmarMedicine
