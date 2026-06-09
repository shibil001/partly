"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Package, ShoppingBag, Search, ChevronDown, ChevronUp, RefreshCw } from "lucide-react"

interface OrderItem { id: string; name: string; price: number; quantity: number; image?: string; size?: string | null }
interface Order {
  id: string; created_at: string; confirmed_at?: string; shipped_at?: string
  delivered_at?: string; cancelled_at?: string
  status: "pending" | "confirmed" | "processed" | "shipped" | "delivered" | "cancelled"
  total_amount: number; items: OrderItem[]; shipping_address?: any
  payment_method?: string; cancellation_reason?: string; cancelled_by?: string
}

const STATUS_LABEL: Record<string, { title: string; sub: string; color: string }> = {
  pending:   { title: "",              sub: "",                                        color: "text-yellow-700" },
  confirmed: { title: "Confirmed",     sub: "Seller has confirmed your order",       color: "text-blue-700" },
  processed: { title: "Processed",     sub: "Seller packed & Waiting for courier pickup", color: "text-purple-700" },
  shipped:   { title: "In Transit",    sub: "Your order is on the way",              color: "text-indigo-700" },
  delivered: { title: "Delivered",     sub: "Package was handed to resident",        color: "text-green-700" },
  cancelled: { title: "Cancelled",     sub: "If you were charged, refund will be processed in 3–5 business days", color: "text-red-700" },
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [activeFilter, setActiveFilter] = useState("last 30 days")
  const [filterOpen, setFilterOpen] = useState(false)
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null)
  const [expandedSummary, setExpandedSummary] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!localStorage.getItem("user")) { router.push("/login"); return }
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      console.log("Token:", token ? "exists" : "MISSING")
      console.log("API URL:", process.env.NEXT_PUBLIC_API_URL)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      console.log("Response status:", res.status)
      const data = await res.json()
      console.log("Orders API response:", data)
      const raw = (data.orders || []).map((o: any) => ({
        ...o,
        items: typeof o.items === "string" ? JSON.parse(o.items) : (o.items || [])
      }))
      // Flatten — one entry per item
      const parsed = raw.flatMap((o: any) => {
        const items = o.items || []
        if (items.length === 0) return [{ ...o, _orderId: o.id }]
        return items.map((item: any, idx: number) => ({
          ...o,
          id: `${o.id}_${idx}`,
          _orderId: o.id,
          items: [item],
          total_amount: (item.price || 0) * (item.quantity || 1),
        }))
      })
      console.log('Parsed orders:', parsed.length, parsed)
      setOrders(parsed)
    } catch(err) { console.error('Fetch error:', err); setOrders([]) }
    setLoading(false)
  }

  const cancelOrder = async (id: string) => {
    setCancelling(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${id}/cancel`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "cancelled" as const } : o))
        setCancelConfirm(null)
      }
    } catch {}
    setCancelling(false)
  }

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : ""
  const canCancel = (s: Order["status"]) => s === "pending" || s === "confirmed"

  const filtered = orders.filter(o => {
    const now = new Date()
    const orderDate = new Date(o.created_at)
    if (activeFilter === "last 30 days") {
      const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 30)
      if (orderDate < cutoff) return false
    } else if (activeFilter === "past 3 months") {
      const cutoff = new Date(now); cutoff.setMonth(cutoff.getMonth() - 3)
      if (orderDate < cutoff) return false
    } else if (["2024","2025","2026","2027"].includes(activeFilter)) {
      if (orderDate.getFullYear().toString() !== activeFilter) return false
    }
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return o.id.toLowerCase().includes(q) || o.items?.some((i: any) => i.name?.toLowerCase().includes(q))
  })

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">

        {/* Page Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Your Orders</h1>
          <div className="flex items-center gap-2">
            {/* Filter dropdown */}
            <div className="relative">
              <button onClick={() => setFilterOpen(v => !v)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                </svg>
                {activeFilter === "All" ? "Filter" : activeFilter}
                <svg className={`h-3.5 w-3.5 text-gray-400 transition-transform ${filterOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {filterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden w-44">
        {["last 30 days", "past 3 months", "2026", "2025", "2024"].map(f => (
                      <button key={f} onClick={() => { setActiveFilter(f); setFilterOpen(false) }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                          activeFilter === f ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-700 hover:bg-gray-50"
                        }`}>
                        {f}
                        {activeFilter === f && <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button onClick={fetchOrders}
              className="flex items-center gap-1.5 text-sm px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-600 font-medium transition-colors">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by order ID or product name..."
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>



        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="bg-white rounded-lg border border-gray-200 h-48 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag className="h-12 w-12 text-gray-300 mb-4" />
            <h2 className="text-lg font-semibold text-gray-700">{search ? "No matching orders" : "No orders yet"}</h2>
            <p className="text-sm text-gray-400 mt-1 mb-5">{search ? "Try a different search" : "Start shopping to see your orders here"}</p>
            {!search && <a href="/search" className="px-5 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-semibold rounded-full transition-colors">Shop now</a>}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(order => {
              const cfg = STATUS_LABEL[order.status] || STATUS_LABEL.pending
              const isExpanded = expandedOrders.has(order.id)
              const addr = order.shipping_address
              const deliveredDate = order.delivered_at ? new Date(order.delivered_at).toLocaleDateString("en-IN", { day: "numeric", month: "long" }) : null
              const shippedDate = order.shipped_at ? new Date(order.shipped_at).toLocaleDateString("en-IN", { day: "numeric", month: "long" }) : null
              const processedDate = (order as any).processed_at ? new Date((order as any).processed_at).toLocaleDateString("en-IN", { day: "numeric", month: "long" }) : null

              return (
                <div key={order.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">

                  {/* Order Header */}
                  <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-6">
                      <div>
                        <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Order Placed</p>
                        <p className="text-sm text-gray-800">{formatDate(order.created_at)}</p>
                      </div>
                      {order.total_amount > 0 && (
                        <div>
                          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Total</p>
                          <button onClick={() => setExpandedSummary(prev => { const n = new Set(prev); n.has(order.id) ? n.delete(order.id) : n.add(order.id); return n })}
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                            ₹{order.total_amount.toLocaleString("en-IN")} {expandedSummary.has(order.id) ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>
                        </div>
                      )}
                      {addr && (
                        <div>
                          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Ship To</p>
                          <button onClick={() => setExpandedOrders(prev => { const n = new Set(prev); n.has(order.id) ? n.delete(order.id) : n.add(order.id); return n })}
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                            {addr.full_name} {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Order #</p>
                      <p className="text-xs font-mono text-gray-700">{order.id.slice(0,8).toUpperCase()}</p>
                    </div>
                  </div>

                  {/* Expanded Address */}
                  {isExpanded && addr && (
                    <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 text-sm text-gray-700">
                      <p className="font-medium">{addr.full_name}</p>
                      <p className="text-xs text-gray-500">{addr.address}, {addr.city}, {addr.state} - {addr.pincode}</p>
                      <p className="text-xs text-gray-500">{addr.phone}</p>
                    </div>
                  )}

                  {/* Expanded Summary */}
                  {expandedSummary.has(order.id) && (
                    <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 text-sm space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Order Summary</p>
                      {order.items?.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs text-gray-600">
                          <span className="truncate max-w-[60%]">{item.name}{item.size ? ` (${item.size})` : ""} × {item.quantity}</span>
                          <span>₹{((item.price || 0) * (item.quantity || 1)).toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-xs text-gray-500 pt-1 border-t border-blue-100">
                        <span>Delivery</span><span className="text-green-600 font-medium">Free</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-blue-100">
                        <span>Total</span><span>₹{(order.total_amount || 0).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 pt-1 border-t border-blue-100">
                        <span>Payment</span>
                        <span className="font-medium">{order.payment_method === "cod" ? "Cash on Delivery" : order.payment_method || "COD"}</span>
                      </div>
                    </div>
                  )}

                  {/* Order Body */}
                  <div className="p-5 flex gap-5">
                    {/* Left: Status + Items */}
                    <div className="flex-1 min-w-0">
                      {cfg.title && <h2 className={`text-lg font-bold mb-0.5 ${cfg.color}`}>
                        {cfg.title}{order.status === "delivered" && deliveredDate ? ` ${deliveredDate}` : ""}
                        {order.status === "shipped" && shippedDate ? ` ${shippedDate}` : ""}
                        {order.status === "processed" && processedDate ? ` ${processedDate}` : ""}
                      </h2>}
                      {cfg.sub && <p className="text-sm text-gray-500 mb-4">{cfg.sub}</p>}
                      {order.status === "cancelled" && (
                        <div className="mb-3 space-y-0.5">
                          {order.cancelled_by === "seller" && (
                            <p className="text-xs font-medium text-red-500">Cancelled by seller</p>
                          )}
                          {order.cancellation_reason && (
                            <p className="text-xs text-gray-500">Reason: {order.cancellation_reason}</p>
                          )}
                        </div>
                      )}

                      {/* Items */}
                      <div className="space-y-4">
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex items-start gap-4">
                            <div className="w-20 h-20 rounded bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                              {item.image
                                ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center"><Package className="h-7 w-7 text-gray-300" /></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-800 line-clamp-3 font-medium">{item.name}</p>
                              {item.size && <span className="inline-block text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-semibold mt-0.5">Size: {item.size}</span>}
                              <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity} · ₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                              {order.status === "delivered" && (
                                <p className="text-xs text-gray-400 mt-1">Return window closed on {new Date(new Date(order.delivered_at || order.created_at).getTime() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
                              )}
                              <div className="flex gap-2 mt-2 flex-wrap">
                                <a href={`/product/${item.id}`}
                                  className="text-xs px-3 py-1.5 border border-gray-300 rounded-full hover:bg-gray-50 text-gray-700 font-medium">
                                  View your item
                                </a>
                                {order.status !== "cancelled" && (
                                  <a href={`/product/${item.id}`}
                                    className="text-xs px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 rounded-full text-gray-900 font-medium flex items-center gap-1">
                                    🛒 Buy it again
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="w-44 flex-shrink-0 space-y-2">
                      {order.status !== "cancelled" && (
                        <button onClick={() => setTrackingOrder(order)}
                          className="w-full text-sm py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium">
                          Track package
                        </button>
                      )}
                      {order.status === "delivered" && (
                        <>
                          <button className="w-full text-sm py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium">Leave seller feedback</button>
                          <button className="w-full text-sm py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium">Write a product review</button>
                        </>
                      )}
                      <button onClick={() => window.open(`/invoice/${(order as any)._orderId || order.id}`, "_blank")}
                        className="w-full text-sm py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium">
                        Invoice
                      </button>
                      {canCancel(order.status) && (
                        <>
                          {cancelConfirm === ((order as any)._orderId || order.id) ? (
                            <div className="border border-red-200 rounded-lg p-2 bg-red-50 space-y-2">
                              <p className="text-xs text-red-700 font-medium">Cancel this order?</p>
                              <button onClick={() => cancelOrder((order as any)._orderId || order.id)} disabled={cancelling}
                                className="w-full text-xs py-1.5 bg-red-500 text-white rounded font-medium disabled:opacity-50">
                                {cancelling ? "..." : "Yes, Cancel"}
                              </button>
                              <button onClick={() => setCancelConfirm(null)}
                                className="w-full text-xs py-1.5 border border-gray-200 rounded text-gray-600">Keep Order</button>
                            </div>
                          ) : (
                            <button onClick={() => setCancelConfirm(order.id)}
                              className="w-full text-sm py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium">
                              Cancel order
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
      {/* Tracking Modal */}
      {trackingOrder && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setTrackingOrder(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Track Package</p>
                  <p className="text-xs text-gray-400 font-mono">#{trackingOrder.id.slice(0,8).toUpperCase()}</p>
                </div>
                <button onClick={() => setTrackingOrder(null)} className="text-gray-400 hover:text-gray-600 text-xl font-light">✕</button>
              </div>
              <div className="px-6 py-5">
                {/* Timeline */}
                <div className="relative pl-6 space-y-0">
                  {[
                    { label: "Order Placed", ts: trackingOrder.created_at,   desc: "Your order has been received", extra: null, order: 0 },
                    { label: "Confirmed",    ts: trackingOrder.confirmed_at || null, desc: "Seller confirmed your order",  extra: null, order: 1 },
                    { label: "Processed",    ts: (trackingOrder as any).processing_at || (trackingOrder as any).processed_at || null,
                      desc: "Seller packed & Waiting for courier pickup",
                      extra: { partner: (trackingOrder as any).courier || (trackingOrder as any).delivery_partner, tracking: (trackingOrder as any).tracking_number }, order: 2 },
                    { label: "In Transit",   ts: (trackingOrder as any).shipped_at || null, desc: "Courier picked up your package", extra: null, order: 3 },
                    { label: "Delivered",    ts: trackingOrder.delivered_at, desc: "Package handed to resident",   extra: null, order: 4 },
                  ].map((step: any, idx, arr) => {
                    const statusOrderMap: Record<string,number> = { pending: 0, confirmed: 1, processing: 2, processed: 2, shipped: 3, delivered: 4, cancelled: 0 }
                    const currentOrder = statusOrderMap[trackingOrder.status] ?? 0
                    const done = step.order <= currentOrder
                    const active = step.order === currentOrder
                    return (
                      <div key={idx} className="relative pb-6 last:pb-0">
                        {idx < arr.length - 1 && (
                          <div className={`absolute left-[-16px] top-4 bottom-0 w-0.5 ${done && step.order < currentOrder ? "bg-blue-500" : "bg-gray-200"}`} />
                        )}
                        <div className={`absolute left-[-20px] top-1 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${done ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300"}`}>
                          {done && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                        <div className={active ? "" : ""}>
                          <p className={`text-sm font-semibold ${done ? "text-gray-900" : "text-gray-400"}`}>{step.label}</p>
                          <p className={`text-xs mt-0.5 ${done ? "text-gray-500" : "text-gray-300"}`}>{step.desc}</p>
                          {step.ts && <p className="text-xs text-blue-500 mt-0.5">{new Date(step.ts).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>}
                          {step.extra?.partner && (
                            <div className="mt-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5 space-y-0.5">
                              <p className="text-xs text-gray-500">Delivery partner: <span className="font-semibold text-gray-700">{step.extra.partner}</span></p>
                              {step.extra.tracking && <p className="text-xs text-gray-500">Tracking: <span className="font-mono font-semibold text-blue-600">{step.extra.tracking}</span></p>}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="px-6 pb-5">
                <button onClick={() => setTrackingOrder(null)} className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">Close</button>
              </div>
            </div>
          </div>
        </>
      )}

      <Footer />
    </div>
  )
}