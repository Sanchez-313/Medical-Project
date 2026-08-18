import React, { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import Cards from '../Cards/Cards'
import Banner from '../Banner/Banner'
import { requestJson } from '../../lib/api'
import { fallbackCatalogProducts, mapApiProduct } from '../../lib/productCatalog'

const CategoryPage = ({ title, bgImage, categories = [], addToCart: addToCartProp }) => {
    const outletContext = useOutletContext() || {}
    const addToCart = addToCartProp || outletContext.addToCart
    const normalizedSearch = (outletContext.searchTerm || '').trim().toLowerCase()
    const [products, setProducts] = useState(fallbackCatalogProducts)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        let mounted = true

        const loadProducts = async () => {
            try {
                setIsLoading(products.length === 0)
                const params = new URLSearchParams({ limit: '200' })
                if (!categories.includes('All') && categories.length === 1) {
                    params.set('category', categories[0])
                }
                if (outletContext.searchTerm?.trim()) {
                    params.set('search', outletContext.searchTerm.trim())
                }
                const payload = await requestJson(`/api/products?${params.toString()}`)
                const nextProducts = (payload?.data?.products || []).map(mapApiProduct)
                if (mounted) {
                    setProducts(nextProducts.length > 0 ? nextProducts : fallbackCatalogProducts)
                }
            } catch {
                if (mounted) {
                    setProducts(fallbackCatalogProducts)
                }
            } finally {
                if (mounted) {
                    setIsLoading(false)
                }
            }
        }

        loadProducts()
        return () => {
            mounted = false
        }
    }, [categories, outletContext.searchTerm])

    let filteredItems = categories.includes('All')
    ? products
    : products.filter(item=> categories.includes(item.category))

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
                category={product.categoryLabel || product.category}
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
        {isLoading && filteredItems.length === 0 ? (
            <p className='pb-14 text-center text-slate-500'>
                Loading products...
            </p>
        ) : null}
        {!isLoading && filteredItems.length === 0 && !normalizedSearch ? (
            <p className='pb-14 text-center text-slate-500'>
                No products available in this category right now.
            </p>
        ) : null}
        {normalizedSearch && filteredItems.length === 0 ? (
            <p className='pb-14 text-center text-slate-500'>
                No products found for "{outletContext.searchTerm}".
            </p>
        ) : null}
    </div>
  )
}

export default CategoryPage
