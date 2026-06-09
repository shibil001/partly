"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, MoreVertical } from "lucide-react"

const activities = [
  { name: "Rahul Kumar", avatar: "RK", action: "Purchased", item: "Front Bumper Assembly", price: 4500, quantity: 1, time: "2 min ago" },
  { name: "Priya Sharma", avatar: "PS", action: "Purchased", item: "OEM Brake Pad Set", price: 1200, quantity: 2, time: "5 min ago" },
  { name: "Amit Patel", avatar: "AP", action: "Purchased", item: "Alloy Wheel Set (4pcs)", price: 18000, quantity: 1, time: "12 min ago" },
  { name: "Sumit Singh", avatar: "SS", action: "Returned", item: "Headlamp Bulb H4", price: 450, quantity: 1, time: "25 min ago" },
  { name: "Deepa Nair", avatar: "DN", action: "Purchased", item: "Air Filter Genuine", price: 850, quantity: 1, time: "45 min ago" },
  { name: "Vijay Reddy", avatar: "VR", action: "Purchased", item: "Engine Block", price: 35000, quantity: 1, time: "1 hr ago" },
  { name: "Anita Joshi", avatar: "AJ", action: "Purchased", item: "Clutch Plate Kit", price: 2400, quantity: 1, time: "1.5 hr ago" },
  { name: "Ravi Menon", avatar: "RM", action: "Purchased", item: "Shock Absorber Set", price: 6500, quantity: 2, time: "2 hr ago" },
  { name: "Kavya Iyer", avatar: "KI", action: "Returned", item: "Windshield Glass", price: 8900, quantity: 1, time: "3 hr ago" },
  { name: "Manoj Gupta", avatar: "MG", action: "Purchased", item: "Battery 60Ah", price: 4200, quantity: 1, time: "4 hr ago" },
]

const ITEMS_PER_PAGE = 5

export function LastActivity() {
  const [currentPage, setCurrentPage] = useState(0)
  const totalPages = Math.ceil(activities.length / ITEMS_PER_PAGE)
  const startIndex = currentPage * ITEMS_PER_PAGE
  const currentActivities = activities.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  return (
    <div className="bg-white border border-gray-200 rounded-xl">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Last Activity</h3>
        <span className="text-sm text-gray-500">
          Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, activities.length)} of {activities.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-400 px-5 pb-3 pt-4">Customer</th>
              <th className="text-left text-xs font-medium text-gray-400 pb-3 pt-4">Item</th>
              <th className="text-right text-xs font-medium text-gray-400 pb-3 pt-4">Price</th>
              <th className="text-right text-xs font-medium text-gray-400 pb-3 pt-4">Qty</th>
              <th className="text-right text-xs font-medium text-gray-400 pb-3 pt-4">Time</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {currentActivities.map((activity, index) => (
              <tr key={index} className="border-b border-gray-50 last:border-0">
                <td className="py-3 px-5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600">{activity.avatar}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.name}</p>
                      <p className={`text-xs ${activity.action === "Returned" ? "text-red-500" : "text-blue-600"}`}>
                        {activity.action}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3">
                  <span className="text-sm text-gray-700">{activity.item}</span>
                </td>
                <td className="py-3 text-right">
                  <span className="text-sm font-medium text-gray-900">₹{activity.price.toLocaleString("en-IN")}</span>
                </td>
                <td className="py-3 text-right">
                  <span className="text-sm text-gray-500">{activity.quantity}</span>
                </td>
                <td className="py-3 text-right">
                  <span className="text-xs text-gray-400">{activity.time}</span>
                </td>
                <td className="py-3 pr-4">
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <MoreVertical className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
        <button
          onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
          disabled={currentPage === 0}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 border border-gray-200 rounded-lg px-3 py-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        <div className="flex items-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                currentPage === i
                  ? "bg-blue-600 text-white"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={currentPage === totalPages - 1}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 border border-gray-200 rounded-lg px-3 py-1.5"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}