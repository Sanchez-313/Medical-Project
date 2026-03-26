import React from 'react'
import { useOutletContext } from 'react-router-dom'
import CategoryPage from '../CategoryPage/CategoryPage'
import EngMedicine from '../../assets/Engmedicines/EngMedicine.png'
const EnglishMedicines = () => {
  const { addToCart } = useOutletContext() || {}
  return (
    <div>
        <CategoryPage title="English Medicine" bgImage={EngMedicine} categories={['EnglishMedicine']} addToCart={addToCart} />
    </div>
  )
}

export default EnglishMedicines
