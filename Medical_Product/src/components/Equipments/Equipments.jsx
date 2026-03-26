import React from 'react'
import { useOutletContext } from 'react-router-dom'
import CategoryPage from '../CategoryPage/CategoryPage'
import BgEquipment from '../../assets/Equipments/medical-equipment-and-medicine-design-vector-removebg-preview.png'
const Equipments = () => {
  const { addToCart } = useOutletContext() || {}
  return (
    <div>
        <CategoryPage title="Medical Equipments" bgImage={BgEquipment} categories={['Equipment']} addToCart={addToCart} />
    </div>
  )
}

export default Equipments
