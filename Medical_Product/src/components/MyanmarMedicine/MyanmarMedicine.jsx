import React from 'react'
import CategoryPage from '../CategoryPage/CategoryPage'
import BgMyanmarMedicine from '../../assets/Myamedicines/MyanmarMedicine.png'
const MyanmarMedicine = () => {
  return (
    <div>
        <CategoryPage title="Myanmar Medicine" bgImage={BgMyanmarMedicine} categories={['MyanmarMedicine']} />
    </div>
  )
}

export default MyanmarMedicine