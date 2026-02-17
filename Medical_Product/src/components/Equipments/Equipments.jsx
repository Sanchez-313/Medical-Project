import React from 'react'
import CategoryPage from '../CategoryPage/CategoryPage'
import BgEquipment from '../../assets/Equipments/medical-equipment-and-medicine-design-vector-removebg-preview.png'
const Equipments = () => {
  return (
    <div>
        <CategoryPage title="Medical Equipments" bgImage={BgEquipment} categories={['Equipment']} />
    </div>
  )
}

export default Equipments