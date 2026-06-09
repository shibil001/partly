"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, LineChart, Line } from "recharts"

export function RevenueCards() {
  const [loading, setLoading] = useState(true)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [activeProducts, setActiveProducts] = useState(0)
  const [monthlyData, setMonthlyData] = useState<{month: string, value: number}[]>([])
  const [orderTrend, setOrderTrend] = useState<{date: string, value: number}[]>([])

  useEffect(() => {
    const token = localStorage.getItem("seller_token")
    if (!token) return

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/seller`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data?.orders) {
          const orders = data.orders.filter((o: any) => o.status !== 'cancelled')
          setTotalOrders(orders.length)
          const revenue = orders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0)
          setTotalRevenue(revenue)

          // Group by month for chart
          const byMonth: Record<string, number> = {}
          orders.forEach((o: any) => {
            const month = new Date(o.created_at).toLocaleString('en-IN', { month: 'short' })
            byMonth[month] = (byMonth[month] || 0) + (o.total_amount || 0)
          })
          const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
          setMonthlyData(months.filter(m => byMonth[m]).map(m => ({ month: m, value: byMonth[m] })).slice(-5))

          // Order trend by week
          const byWeek: Record<string, number> = {}
          orders.forEach((o: any) => {
            const d = new Date(o.created_at)
            const week = `${d.getDate()} ${d.toLocaleString('en-IN', { month: 'short' })}`
            byWeek[week] = (byWeek[week] || 0) + 1
          })
          setOrderTrend(Object.entries(byWeek).slice(-4).map(([date, value]) => ({ date, value })))
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sellers/products`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data?.products) setActiveProducts(data.products.filter((p: any) => p.status === 'active').length)
      })
      .catch(() => {})
  }, [])

  const fmtRevenue = (v: number) => {
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`
    if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`
    return `₹${v.toLocaleString("en-IN")}`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {/* Total Revenue */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">
                {loading ? "…" : fmtRevenue(totalRevenue)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">All time earnings</p>
          </div>
          {monthlyData.length > 0 && (
            <BarChart width={100} height={60} data={monthlyData}>
              <Bar dataKey="value" fill="#2563eb" radius={[2, 2, 0, 0]} />
            </BarChart>
          )}
        </div>
      </div>

      {/* Active Products */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Active Listings</h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">
                {loading ? "…" : activeProducts.toLocaleString("en-IN")}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Products live on store</p>
          </div>
        </div>
      </div>

      {/* Total Orders */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Total Orders</h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">
                {loading ? "…" : totalOrders.toLocaleString("en-IN")}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">All time orders</p>
          </div>
          {orderTrend.length > 0 && (
            <LineChart width={100} height={60} data={orderTrend}>
              <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          )}
        </div>
      </div>

    </div>
  )
}