"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Activity {
  name: string
  avatar: string
  action: string
  item: string
  price: number
  quantity: number
  time: string
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days > 1 ? "s" : ""} ago`
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
}

const ITEMS_PER_PAGE = 5

export function LastActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)

  useEffect(() => {
    const token = localStorage.getItem("seller_token")
    if (!token) return

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/seller`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (!data?.orders) return
        const acts: Activity[] = []
        data.orders.forEach((order: any) => {
          const name = order.buyer_name || order.buyer_username || "Customer"
          const items = order.items || []
          if (items.length > 0) {
            items.forEach((item: any) => {
              acts.push({
                name,
                avatar: initials(name),
                action: order.status === "cancelled" ? "Cancelled" : "Purchased",
                item: item.name || item.title || "Part",
                price: item.price || (item.price_paise ? item.price_paise / 100 : 0),
                quantity: item.quantity || 1,
                time: timeAgo(order.created_at),
              })
            })
          } else {
            acts.push({
              name,
              avatar: initials(name),
              action: order.status === "cancelled" ? "Cancelled" : "Purchased",
              item: "Order #" + order.id.slice(0, 8).toUpperCase(),
              price: order.total_amount || 0,
              quantity: 1,
              time: timeAgo(order.created_at),
            })
          }
        })
        setActivities(acts)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const totalPages = Math.max(1, Math.ceil(activities.length / ITEMS_PER_PAGE))
  const startIndex = currentPage * ITEMS_PER_PAGE
  const current = activities.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  return (
    <div className="bg-white border border-gray-200 rounded-xl">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Last Activity</h3>
        {!loading && activities.length > 0 && (
          <span className="text-sm text-gray-500">
            Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, activities.length)} of {activities.length}
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No orders yet</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-400 px-5 pb-3 pt-4">Customer</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-3 pt-4">Item</th>
                <th className="text-right text-xs font-medium text-gray-400 pb-3 pt-4">Price</th>
                <th className="text-right text-xs font-medium text-gray-400 pb-3 pt-4">Qty</th>
                <th className="text-right text-xs font-medium text-gray-400 pb-3 pt-4 pr-5">Time</th>
              </tr>
            </thead>
            <tbody>
              {current.map((a, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-blue-600">{a.avatar}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{a.name}</p>
                        <p className={`text-xs ${a.action === "Cancelled" ? "text-red-500" : "text-blue-600"}`}>
                          {a.action}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 max-w-[180px]">
                    <span className="text-sm text-gray-700 truncate block">{a.item}</span>
                  </td>
                  <td className="py-3 text-right">
                    <span className="text-sm font-medium text-gray-900">₹{a.price.toLocaleString("en-IN")}</span>
                  </td>
                  <td className="py-3 text-right">
                    <span className="text-sm text-gray-500">{a.quantity}</span>
                  </td>
                  <td className="py-3 text-right pr-5">
                    <span className="text-xs text-gray-400">{a.time}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {activities.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
          <button
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 border border-gray-200 rounded-lg px-3 py-1.5"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  currentPage === i ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage === totalPages - 1}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 border border-gray-200 rounded-lg px-3 py-1.5"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}