import React, { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'

const Orders = () => {
  const outletContext = useOutletContext() || {}
  const { orderHistory = [] } = outletContext
  const [backendOrders, setBackendOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadOrders = async () => {
      const token = localStorage.getItem('authToken')
      if (!token) {
        if (mounted) setIsLoading(false)
        return
      }

      try {
        const response = await fetch('http://localhost:8000/api/orders', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const data = await response.json()
        if (!mounted) return
        if (response.ok && data?.success) {
          setBackendOrders(data?.data?.orders || [])
        }
      } catch {
        if (!mounted) return
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    loadOrders()
    return () => {
      mounted = false
    }
  }, [])

  const liveOrders = backendOrders.length ? backendOrders : orderHistory

  const totalOrders = liveOrders.length
  const totalItemsBought = liveOrders.reduce((sum, order) => {
    const items = Array.isArray(order?.items) ? order.items : []
    return (
      sum +
      items.reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0)
    )
  }, 0)
  const totalSpent = liveOrders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  )

  const formatStatus = (status) => {
    const normalized = String(status || '').toLowerCase()
    if (normalized === 'delivered') return 'Delivered'
    if (normalized === 'shipped') return 'Delivering'
    if (normalized === 'confirmed') return 'Confirmed'
    return 'Pending'
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-16 pt-28 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <h1 className="text-3xl font-black text-slate-900 md:text-4xl">Purchase Bills</h1>
        <p className="mt-2 text-sm text-slate-500 md:text-base">
          Your complete order history and billing details.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="Times Bought" value={String(totalOrders)} />
          <StatCard label="Items Purchased" value={String(totalItemsBought)} />
          <StatCard label="Total Spent" value={`${totalSpent.toLocaleString()} MMK`} />
        </div>

        {!isLoading && liveOrders.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-slate-500">No purchase records yet.</p>
            <Link
              to="/allproducts"
              className="mt-4 inline-block rounded-full bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {liveOrders.map((order, index) => (
              <article
                key={order.id || `${order.createdAt}-${index}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      Bill #{totalOrders - index}
                    </h2>
                    <p className="text-xs font-semibold text-slate-500">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : 'Unknown date'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-black uppercase text-blue-700">
                      {order.paymentMethod}
                    </div>
                    <div className="rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-black uppercase text-emerald-700">
                      {formatStatus(order.status)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-500">
                        <th className="py-2 pr-4">Item</th>
                        <th className="py-2 pr-4">Qty</th>
                        <th className="py-2 pr-4">Price</th>
                        <th className="py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(order.items || []).map((item) => (
                        <tr key={`${order.id}-${item.id}`} className="border-b border-slate-50">
                          <td className="py-2 pr-4 font-semibold text-slate-800">{item.name}</td>
                          <td className="py-2 pr-4 text-slate-600">{item.quantity}</td>
                          <td className="py-2 pr-4 text-slate-600">
                            {Number(item.unitPrice || 0).toLocaleString()} MMK
                          </td>
                          <td className="py-2 font-bold text-slate-800">
                            {Number(item.totalPrice || 0).toLocaleString()} MMK
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-700 md:grid-cols-2">
                  <div>
                    <p>
                      <span className="font-bold">Customer:</span> {order.shipping?.fullName}
                    </p>
                    <p>
                      <span className="font-bold">Phone:</span> {order.shipping?.phone}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p>
                      <span className="font-bold">Subtotal:</span>{' '}
                      {Number(order.subtotal || 0).toLocaleString()} MMK
                    </p>
                    <p>
                      <span className="font-bold">Tax (5%):</span>{' '}
                      {Number(order.tax || 0).toLocaleString()} MMK
                    </p>
                    <p className="text-base font-black text-blue-700">
                      Total: {Number(order.total || 0).toLocaleString()} MMK
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const StatCard = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5">
    <p className="text-xs font-black uppercase tracking-widest text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
  </div>
)

export default Orders
