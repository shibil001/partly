"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts"

const data = [
  { date: "1 Apr", sold: 45, returns: 5 },
  { date: "5 Apr", sold: 78, returns: 8 },
  { date: "10 Apr", sold: 92, returns: 12 },
  { date: "13 Apr", sold: 85, returns: 10 },
  { date: "15 Apr", sold: 75, returns: 7 },
  { date: "18 Apr", sold: 95, returns: 9 },
  { date: "20 Apr", sold: 104, returns: 0 },
  { date: "22 Apr", sold: 88, returns: 6 },
  { date: "25 Apr", sold: 92, returns: 8 },
  { date: "28 Apr", sold: 76, returns: 5 },
  { date: "30 Apr", sold: 85, returns: 7 },
]

export function SalesChart() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Sales Analytics</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600" />
            <span className="text-gray-500">Parts Sold</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-200" />
            <span className="text-gray-500">Returns</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          />
          <Bar dataKey="sold" fill="#2563eb" radius={[4, 4, 0, 0]} name="Sold" />
          <Bar dataKey="returns" fill="#e5e7eb" radius={[4, 4, 0, 0]} name="Returns" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}