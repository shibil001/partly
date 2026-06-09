"use client"

import { useState, useEffect } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts"

type Period = "7d" | "30d" | "90d"

export function SalesChart() {
  const [period, setPeriod] = useState<Period>("30d")
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{ date: string; revenue: number; orders: number }[]>([])

  useEffect(() => {
    const token = localStorage.getItem("seller_token")
    if (!token) return
    setLoading(true)

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/seller`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(res => {
        if (!res?.orders) return

        const now = new Date()
        const days = period === "7d" ? 7 : period === "30d" ? 30 : 90
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

        const filtered = res.orders.filter((o: any) =>
          o.status !== 'cancelled' && new Date(o.created_at) >= cutoff
        )

        // Group by date
        const byDate: Record<string, { revenue: number; orders: number }> = {}

        // Pre-fill all dates in range
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          let label: string
          if (period === "7d") {
            label = d.toLocaleString('en-IN', { weekday: 'short' })
          } else if (period === "30d") {
            label = `${d.getDate()} ${d.toLocaleString('en-IN', { month: 'short' })}`
          } else {
            // 90d — group by week
            const weekStart = new Date(d)
            weekStart.setDate(d.getDate() - d.getDay())
            label = `${weekStart.getDate()} ${weekStart.toLocaleString('en-IN', { month: 'short' })}`
          }
          if (!byDate[label]) byDate[label] = { revenue: 0, orders: 0 }
        }

        filtered.forEach((o: any) => {
          const d = new Date(o.created_at)
          let label: string
          if (period === "7d") {
            label = d.toLocaleString('en-IN', { weekday: 'short' })
          } else if (period === "30d") {
            label = `${d.getDate()} ${d.toLocaleString('en-IN', { month: 'short' })}`
          } else {
            const weekStart = new Date(d)
            weekStart.setDate(d.getDate() - d.getDay())
            label = `${weekStart.getDate()} ${weekStart.toLocaleString('en-IN', { month: 'short' })}`
          }
          if (!byDate[label]) byDate[label] = { revenue: 0, orders: 0 }
          byDate[label].revenue += o.total_amount || 0
          byDate[label].orders += 1
        })

        // For 30d, only show every 3rd day to avoid crowding
        let entries = Object.entries(byDate).map(([date, v]) => ({ date, ...v }))
        if (period === "30d") entries = entries.filter((_, i) => i % 3 === 0)

        setData(entries)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [period])

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Sales Analytics</h3>
        <div className="flex items-center gap-2">
          {(["7d", "30d", "90d"] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                period === p
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
          Loading...
        </div>
      ) : data.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
          No orders in this period
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 text-sm mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600" />
              <span className="text-gray-500">Revenue (₹)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-200" />
              <span className="text-gray-500">Orders</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                tickFormatter={(v) => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                formatter={(value: any, name: any) => [
                  name === "revenue" ? `₹${Number(value).toLocaleString("en-IN")}` : value,
                  name === "revenue" ? "Revenue" : "Orders"
                ]}
              />
              <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} name="revenue" />
              <Bar dataKey="orders" fill="#e5e7eb" radius={[4, 4, 0, 0]} name="orders" />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  )
}