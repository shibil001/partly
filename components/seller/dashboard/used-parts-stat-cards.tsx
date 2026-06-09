"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Users, Star, IndianRupee, TrendingUp, TrendingDown } from "lucide-react"

interface StatCardProps {
  title: string
  value: string
  change: number
  changeText: string
  icon: React.ReactNode
}

function StatCard({ title, value, change, changeText, icon }: StatCardProps) {
  const isPositive = change >= 0
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
            <span className={`text-sm font-medium px-2 py-0.5 rounded-full flex items-center gap-1
              ${isPositive ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"}`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isPositive ? "+" : ""}{change}%
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-2">{changeText}</p>
        </div>
      </div>
    </div>
  )
}

export function UsedPartsStatCards() {
  const [totalOrders, setTotalOrders] = useState("—")
  const [totalCustomers, setTotalCustomers] = useState("—")
  const [totalRevenue, setTotalRevenue] = useState("—")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("seller_token")
    if (!token) return
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/seller`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data?.orders) {
          const orders = data.orders
          setTotalOrders(orders.length.toLocaleString("en-IN"))
          // Unique customers
          const uniqueCustomers = new Set(orders.map((o: any) => o.user_id)).size
          setTotalCustomers(uniqueCustomers.toLocaleString("en-IN"))
          // Total revenue
          const revenue = orders.reduce((sum: number, o: any) => sum + (o.total || o.amount || 0), 0)
          setTotalRevenue(revenue > 0 ? `₹${revenue.toLocaleString("en-IN")}` : "—")
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const stats = [
    {
      title: "Total Orders",
      value: loading ? "…" : totalOrders,
      change: 5.2,
      changeText: "All time orders",
      icon: <ShoppingCart className="w-4 h-4" />,
    },
    {
      title: "Total Customers",
      value: loading ? "…" : totalCustomers,
      change: 4.3,
      changeText: "Unique buyers",
      icon: <Users className="w-4 h-4" />,
    },
    {
      title: "Customer Satisfaction",
      value: "4.8",
      change: 2.3,
      changeText: "Based on ratings",
      icon: <Star className="w-4 h-4" />,
    },
    {
      title: "Total Revenue",
      value: loading ? "…" : totalRevenue,
      change: 8.1,
      changeText: "All time earnings",
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