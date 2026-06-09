"use client"

import { useState, useEffect } from "react"

interface StateRow {
  name: string
  abbr: string
  orders: number
  shipped: number
  percentage: number
}

// Map state codes to full names
const STATE_NAMES: Record<string, string> = {
  KL: "Kerala", MH: "Maharashtra", DL: "Delhi", KA: "Karnataka",
  TN: "Tamil Nadu", GJ: "Gujarat", RJ: "Rajasthan", UP: "Uttar Pradesh",
  WB: "West Bengal", AP: "Andhra Pradesh", TS: "Telangana", MP: "Madhya Pradesh",
  PB: "Punjab", HR: "Haryana", BR: "Bihar", OR: "Odisha", AS: "Assam",
  JH: "Jharkhand", UK: "Uttarakhand", HP: "Himachal Pradesh", GA: "Goa",
  JK: "J&K", NL: "Nagaland", MN: "Manipur", ML: "Meghalaya", MZ: "Mizoram",
  TR: "Tripura", SK: "Sikkim", AR: "Arunachal", CH: "Chandigarh",
}

export function TopSalesByState() {
  const [states, setStates] = useState<StateRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("seller_token")
    if (!token) return

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/seller`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (!data?.orders) return

        const byState: Record<string, { orders: number; shipped: number }> = {}

        data.orders.forEach((order: any) => {
          if (order.status === "cancelled") return
          // Try to get state from shipping address or buyer location
          const state = order.state_code || order.shipping_state || order.buyer_state || "Other"
          if (!byState[state]) byState[state] = { orders: 0, shipped: 0 }
          byState[state].orders++
          if (["shipped", "delivered", "processing", "processed"].includes(order.status)) {
            byState[state].shipped++
          }
        })

        const total = Object.values(byState).reduce((s, v) => s + v.orders, 0) || 1

        const rows: StateRow[] = Object.entries(byState)
          .map(([code, v]) => ({
            name: STATE_NAMES[code] || code,
            abbr: code.slice(0, 2).toUpperCase(),
            orders: v.orders,
            shipped: v.shipped,
            percentage: Math.round((v.orders / total) * 100),
          }))
          .sort((a, b) => b.orders - a.orders)
          .slice(0, 5)

        setStates(rows)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Top Sales by State</h3>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 text-sm py-8">Loading...</div>
      ) : states.length === 0 ? (
        <div className="text-center text-gray-400 text-sm py-8">No order data yet</div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between text-xs text-gray-400 font-medium mb-3 px-1">
            <span>State</span>
            <div className="flex items-center gap-6">
              <span>Orders</span>
              <span>Shipped</span>
            </div>
          </div>

          <div className="space-y-4">
            {states.map((state) => (
              <div key={state.name} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
                      {state.abbr}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{state.name}</span>
                  </div>
                  <div className="flex items-center gap-6 text-sm font-medium">
                    <span className="text-gray-900 w-10 text-right">{state.orders}</span>
                    <span className="text-blue-600 w-10 text-right">{state.shipped}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${state.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}