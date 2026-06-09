"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, Users, ShoppingCart, IndianRupee, Package } from "lucide-react"

interface StatCardProps {
  title: string
  value: string
  change?: number
  changeText: string
  icon: React.ReactNode
}

function StatCard({ title, value, change, changeText, icon }: StatCardProps) {
  const isPositive = (change ?? 0) >= 0
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            {icon}
            <span className="text-sm font-medium">{title}</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-gray-900">{value}</span>
            {change !== undefined && (
              <span className={`text-sm font-medium px-2 py-0.5 rounded-full flex items-center gap-1
                ${isPositive ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"}`}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isPositive ? "+" : ""}{change}%
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-2">{changeText}</p>
        </div>
      </div>
    </div>
  )
}

export function StatCards() {
  const [loading, setLoading] = useState(true)
  const [totalOrders, setTotalOrders] = useState("—")
  const [totalCustomers, setTotalCustomers] = useState("—")
  const [totalRevenue, setTotalRevenue] = useState("—")
  const [avgOrderValue, setAvgOrderValue] = useState("—")
  const [totalProducts, setTotalProducts] = useState("—")

  useEffect(() => {
    const token = localStorage.getItem("seller_token")
    if (!token) return

    // Fetch orders
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/seller`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data?.orders) {
          const orders = data.orders
          const delivered = orders.filter((o: any) => !['cancelled'].includes(o.status))
          setTotalOrders(delivered.length.toLocaleString("en-IN"))
          const uniqueCustomers = new Set(delivered.map((o: any) => o.buyer_id)).size
          setTotalCustomers(uniqueCustomers.toLocaleString("en-IN"))
          const revenue = delivered.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0)
          setTotalRevenue(revenue > 0 ? `₹${revenue.toLocaleString("en-IN")}` : "₹0")
          const avg = delivered.length > 0 ? revenue / delivered.length : 0
          setAvgOrderValue(avg > 0 ? `₹${Math.round(avg).toLocaleString("en-IN")}` : "—")
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))

    // Fetch products count
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sellers/products`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data?.products) {
          setTotalProducts(data.products.length.toLocaleString("en-IN"))
        }
      })
      .catch(() => {})
  }, [])

  const stats = [
    {
      title: "Total Revenue",
      value: loading ? "…" : totalRevenue,
      changeText: "All time earnings",
      icon: <IndianRupee className="w-4 h-4" />,
    },
    {
      title: "Total Orders",
      value: loading ? "…" : totalOrders,
      changeText: "All time orders",
      icon: <ShoppingCart className="w-4 h-4" />,
    },
    {
      title: "Total Customers",
      value: loading ? "…" : totalCustomers,
      changeText: "Unique buyers",
      icon: <Users className="w-4 h-4" />,
    },
    {
      title: "Avg Order Value",
      value: loading ? "…" : avgOrderValue,
      changeText: "Per order average",
      icon: <IndianRupee className="w-4 h-4" />,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  )
}