"use client"

import { TrendingUp, TrendingDown, Users, Package, ShoppingCart, IndianRupee } from "lucide-react"

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

export function StatCards() {
  const stats = [
  {
    title: "Total Customers",
    value: "892",
    change: 4.3,
    changeText: "Increased by +38 this week",
    icon: <Users className="w-4 h-4" />,
  },
  {
    title: "New Customers",
    value: "124",
    change: 12.5,
    changeText: "Increased by +14 this week",
    icon: <Users className="w-4 h-4" />,
  },
  {
    title: "Avg Order Value",
    value: "₹4,280",
    change: 0.3,
    changeText: "Decreased by ₹12 this week",
    icon: <IndianRupee className="w-4 h-4" />,
  },
  {
    title: "Customer Satisfaction",
    value: "4.8",
    change: 2.3,
    changeText: "Increased by +2.3% this week",
    icon: <ShoppingCart className="w-4 h-4" />,
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