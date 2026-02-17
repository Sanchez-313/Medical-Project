import React from 'react'
import CategoryPage from '../CategoryPage/CategoryPage'
import EngMedicine from '../../assets/Engmedicines/EngMedicine.png'
const EnglishMedicines = () => {
  return (
    <div>
        <CategoryPage title="English Medicine" bgImage={EngMedicine} categories={['EnglishMedicine']} />
    </div>
  )
}

export default EnglishMedicines