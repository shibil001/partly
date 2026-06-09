"use client"

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
} from "recharts"

const revenueData = [
  { month: "Jan", value: 40 },
  { month: "Feb", value: 55 },
  { month: "Mar", value: 75 },
  { month: "Apr", value: 65 },
  { month: "May", value: 85 },
]

const ordersData = [
  { date: "1 Apr", value: 45 },
  { date: "8 Apr", value: 52 },
  { date: "16 Apr", value: 48 },
  { date: "25 Apr", value: 75 },
]

const vehicleData = [
  { name: "Cars", value: 63 },
  { name: "Bikes", value: 37 },
]

const COLORS = ["#2563eb", "#e5e7eb"]

export function RevenueCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {/* Total Revenue */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">₹2.4L</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                +30.4%
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">₹1.8L last month</p>
          </div>
          <BarChart width={100} height={60} data={revenueData}>
            <Bar dataKey="value" fill="#2563eb" radius={[2, 2, 0, 0]} />
          </BarChart>
        </div>
      </div>

      {/* Parts by Vehicle Type */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Parts by Vehicle Type</h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">1,204</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                +79.6%
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">683 orders last month</p>
          </div>
          <PieChart width={80} height={80}>
            <Pie
              data={vehicleData}
              innerRadius={25}
              outerRadius={35}
              paddingAngle={2}
              dataKey="value"
              cx={40}
              cy={40}
            >
              {vehicleData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-600" />
            <span className="text-gray-500">Cars 63%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-gray-200" />
            <span className="text-gray-500">Bikes 37%</span>
          </div>
        </div>
      </div>

      {/* Total Orders */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Total Orders</h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">1,204</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                +51.3%
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">798 orders last month</p>
          </div>
          <LineChart width={100} height={60} data={ordersData}>
            <Line
              type="monotone"
              dataKey="value"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </div>
      </div>

    </div>
  )
}