import React from 'react'
import { useOutletContext } from 'react-router-dom'
import ProductList from '../ProductList/ProductList'
import Cards from '../Cards/Cards'
import Banner from '../Banner/Banner'

const CategoryPage = ({ title, bgImage, categories = [], addToCart: addToCartProp }) => {
    const outletContext = useOutletContext() || {}
    const addToCart = addToCartProp || outletContext.addToCart
    const normalizedSearch = (outletContext.searchTerm || '').trim().toLowerCase()

    let filteredItems = categories.includes('All')
    ? ProductList
    : ProductList.filter(item=> categories.includes(item.category))

    if (normalizedSearch) {
        filteredItems = filteredItems.filter((item) =>
            item.name.toLowerCase().includes(normalizedSearch) ||
            item.category.toLowerCase().includes(normalizedSearch)
        )
    }

    const renderProduct = filteredItems.map(product=>{
        return(
            <Cards
                key={product.id}
                id={product.id}
                image={product.image}
                name={product.name}
                price={product.price}
                category={product.category}
                stock={product.stock}
                description={product.description}
                onAddToCart={addToCart}
            />
        )
    })

  return (
    <div>
        <Banner title={title} bgImage={bgImage} />

        <div className='grid grid-cols-1 md:grid-cols-4 gap-9 py-20 max-w-[1400px] mx-auto px-10'>
            {renderProduct}
        </div>
        {normalizedSearch && filteredItems.length === 0 ? (
            <p className='pb-14 text-center text-slate-500'>
                No products found for "{outletContext.searchTerm}".
            </p>
        ) : null}
    </div>
  )
}

export default CategoryPage
