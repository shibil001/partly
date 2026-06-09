"use client"

import { useState, useEffect, useRef } from "react"
import { RefreshCw, Search, Printer, FileText, ChevronDown, ChevronUp, Package } from "lucide-react"
import { useOrders } from "@/contexts/orders-context"

export type Order = {
  id: string
  orderDate: string
  date: string
  time: string
  buyerName: string
  fulfillmentMethod: string
  salesChannel: string
  customerType: string | null
  image: string
  productName: string
  asin: string
  sku: string
  quantity: number
  subtotal: number
  orderType: string
  shipByDate: string
  deliverByDate: string
  addressType: string
  status: string
  tab: string
  deliveryPartner?: string
  trackingNumber?: string
  cancellationReason?: string
  cancelledBy?: "seller" | "customer"
  cancelledAt?: string
  confirmedAt?: string
  shippedAt?: string
  allItems?: any[]
  shippingAddress?: any
}

const initialOrders: Order[] = [
  {
    id: "ORD-2026-001",
    orderDate: "5 minutes ago",
    date: "12/4/2026",
    time: "11:20 am IST",
    buyerName: "Rahul Kumar",
    fulfillmentMethod: "Seller",
    salesChannel: "Partly",
    customerType: null,
    image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=80&h=80&fit=crop",
    productName: "Front Bumper Assembly - Maruti Swift 2020",
    asin: "PART-BMP-001",
    sku: "BMP21064",
    quantity: 1,
    subtotal: 4500,
    orderType: "Standard",
    shipByDate: "Mon, 14 Apr, 2026 IST",
    deliverByDate: "Wed, 16 Apr, 2026 IST",
    addressType: "Residential",
    status: "Pending",
    tab: "Pending",
  },
  {
    id: "ORD-2026-002",
    orderDate: "12 minutes ago",
    date: "12/4/2026",
    time: "11:08 am IST",
    buyerName: "Priya Sharma",
    fulfillmentMethod: "Seller",
    salesChannel: "Partly",
    customerType: "Business Customer",
    image: "https://images.unsplash.com/photo-1558618047-f4e60cef5e32?w=80&h=80&fit=crop",
    productName: "OEM Brake Pad Set - Maruti Suzuki",
    asin: "PART-BRK-002",
    sku: "BRK00123",
    quantity: 2,
    subtotal: 2400,
    orderType: "Standard",
    shipByDate: "Mon, 14 Apr, 2026 IST",
    deliverByDate: "Wed, 16 Apr, 2026 IST",
    addressType: "Residential",
    status: "Pending",
    tab: "Pending",
  },
  {
    id: "ORD-2026-003",
    orderDate: "25 minutes ago",
    date: "12/4/2026",
    time: "10:55 am IST",
    buyerName: "Amit Patel",
    fulfillmentMethod: "Seller",
    salesChannel: "Partly",
    customerType: null,
    image: "https://images.unsplash.com/photo-1611821064430-0d40291d0f0b?w=80&h=80&fit=crop",
    productName: "Alloy Wheel Set (4pcs) - Honda City",
    asin: "PART-WHL-003",
    sku: "WHL00456",
    quantity: 1,
    subtotal: 18000,
    orderType: "Standard",
    shipByDate: "Mon, 14 Apr, 2026 IST",
    deliverByDate: "Thu, 17 Apr, 2026 IST",
    addressType: "Commercial",
    status: "Pending",
    tab: "Pending",
  },
  {
    id: "ORD-2026-004",
    orderDate: "2 hours ago",
    date: "12/4/2026",
    time: "09:20 am IST",
    buyerName: "Deepa Nair",
    fulfillmentMethod: "Seller",
    salesChannel: "Partly",
    customerType: null,
    image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=80&h=80&fit=crop",
    productName: "Headlamp Bulb H4 - Universal Fit",
    asin: "PART-BLB-004",
    sku: "BLB00789",
    quantity: 2,
    subtotal: 900,
    orderType: "Standard",
    shipByDate: "Tue, 15 Apr, 2026 IST",
    deliverByDate: "Thu, 17 Apr, 2026 IST",
    addressType: "Residential",
    status: "Unshipped",
    tab: "Unshipped",
  },
  {
    id: "ORD-2026-005",
    orderDate: "1 day ago",
    date: "11/4/2026",
    time: "03:15 pm IST",
    buyerName: "Vijay Reddy",
    fulfillmentMethod: "Seller",
    salesChannel: "Partly",
    customerType: null,
    image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=80&h=80&fit=crop",
    productName: "Air Filter Genuine - Hyundai i20",
    asin: "PART-AFT-005",
    sku: "AFT00321",
    quantity: 1,
    subtotal: 850,
    orderType: "Standard",
    shipByDate: "Wed, 16 Apr, 2026 IST",
    deliverByDate: "Fri, 18 Apr, 2026 IST",
    addressType: "Residential",
    status: "Unshipped",
    tab: "Unshipped",
  },
]

const deliveryPartners = ["Delhivery", "Blue Dart", "DTDC", "Ecom Express", "Shadowfax", "Xpressbees", "India Post", "Other"]

const getMinutesAgo = (orderDate: string) => {
  if (orderDate.includes("minutes ago")) return parseInt(orderDate)
  if (orderDate.includes("hour")) return parseInt(orderDate) * 60
  if (orderDate.includes("day")) return parseInt(orderDate) * 60 * 24
  return 99999
}

const getFilterMinutes = (dateFilter: string) => {
  switch (dateFilter) {
    case "All": return 99999
    case "Last 30 minutes": return 30
    case "Last 1 hour": return 60
    case "Today": return 60 * 24
    case "Last 7 days": return 60 * 24 * 7
    case "Last 14 days": return 60 * 24 * 14
    case "Last 30 days": return 60 * 24 * 30
    case "Last 60 days": return 60 * 24 * 60
    case "Last 90 days": return 60 * 24 * 90
    default: return 99999
  }
}

export function OrdersContent() {
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem("seller_orders_tab") || "Pending")
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)

  const switchTab = (tab: string) => {
    setActiveTab(tab)
    sessionStorage.setItem("seller_orders_tab", tab)
  }
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState("order-id")
  const [dateFilter, setDateFilter] = useState("All")
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [processDialog, setProcessDialog] = useState<string | null>(null)
  const [cancelDialog, setCancelDialog] = useState<string | null>(null)
  const [bulkCancelDialog, setBulkCancelDialog] = useState(false)
  const [deliveryPartner, setDeliveryPartner] = useState("")
  const [customPartner, setCustomPartner] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [cancelReason, setCancelReason] = useState("")
  const [bulkCancelReason, setBulkCancelReason] = useState("")
  const [reasonPopup, setReasonPopup] = useState<string | null>(null)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [reasonPopupRect, setReasonPopupRect] = useState<DOMRect | null>(null)
  const [itemCancelDialog, setItemCancelDialog] = useState<{orderId: string; itemId: string; itemName: string} | null>(null)
  const [itemCancelReason, setItemCancelReason] = useState("")
  const [confirmingIds, setConfirmingIds] = useState<Set<string>>(new Set())
  const [processingId, setProcessingId] = useState<string | null>(null)
  const lastActionRef = useRef<number>(0)
  const { setPendingCount } = useOrders()

  const toggleExpand = (id: string) => {
    setExpandedOrders((prev: Set<string>) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const updateItemStatus = async (orderId: string, itemId: string, status: string, reason?: string) => {
    try {
      const token = localStorage.getItem("seller_token")
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}/item/${itemId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, cancellation_reason: reason }),
      })
      // Refresh from DB to get correct state
      fetchOrders(false)
    } catch {}
  }

  const updateOrderStatus = async (id: string, status: string, reason?: string, deliveryPartner?: string, trackingNumber?: string) => {
    const token = localStorage.getItem("seller_token")
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, cancellation_reason: reason, cancelled_by: "seller", delivery_partner: deliveryPartner, tracking_number: trackingNumber }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || `Status update failed: ${res.status}`)
    }
  }

  const fetchOrders = async (showSpinner = true) => {
    if (showSpinner) setLoadingOrders(true)
    try {
      const token = localStorage.getItem("seller_token")
      if (!token) { console.error("fetchOrders: no seller_token in localStorage"); setLoadingOrders(false); return }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/seller`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      console.log("fetchOrders status:", res.status)
      if (!res.ok) { const err = await res.text(); console.error("fetchOrders error response:", err); setLoadingOrders(false); return }
      const data = await res.json()
      console.log("fetchOrders raw data:", data)
      const mapped: Order[] = (data.orders || []).flatMap((o: any) => {
        const items = o.items || []
        const tab = o.status === "pending" ? "Pending" : o.status === "confirmed" ? "Unshipped" : o.status === "processed" ? "Sent" : o.status === "processing" ? "Sent" : o.status === "shipped" ? "Sent" : o.status === "delivered" ? "Sent" : o.status === "cancelled" ? "Cancelled" : "Pending"
        const status = o.status === "processed" ? "Processed" : o.status === "processing" ? "Processed" : o.status === "shipped" ? "Shipped" : o.status === "delivered" ? "Delivered" : tab

        // Pending: group all items into one row with expand
        if (tab === "Pending") {
          const firstItem = items[0] || {}
          return [{
            id: o.id,
            orderDate: new Date(o.created_at).toLocaleString("en-IN"),
            date: new Date(o.created_at).toLocaleDateString("en-IN"),
            time: new Date(o.created_at).toLocaleTimeString("en-IN"),
            buyerName: o.shipping_address?.full_name || "Customer",
            fulfillmentMethod: "Seller", salesChannel: "Partly", customerType: null,
            image: firstItem.image || "",
            productName: items.length > 1 ? `${firstItem.name || "Product"} +${items.length - 1} more` : firstItem.name || "Product",
            asin: firstItem.partNumber || (firstItem.id ? firstItem.id.slice(0, 8).toUpperCase() : ""),
            sku: firstItem.size || "",
            quantity: items.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0),
            subtotal: o.total_amount || items.reduce((sum: number, i: any) => sum + (i.price || 0) * (i.quantity || 1), 0),
            orderType: o.payment_method === "cod" ? "Cash on Delivery" : "Online",
            shipByDate: "", deliverByDate: "", addressType: "Residential",
            status, tab,
            cancellationReason: o.cancellation_reason || "",
            cancelledBy: o.cancelled_by || undefined,
            cancelledAt: o.cancelled_at || o.updated_at || o.created_at,
            confirmedAt: o.confirmed_at, shippedAt: o.shipped_at,
            deliveryPartner: o.delivery_partner || "",
            trackingNumber: o.tracking_number || "",
            shippingAddress: o.shipping_address,
            allItems: items,
          }]
        }

        // All other tabs: one row per item, fallback to order-level row if items empty
        const makeRow = (item: any) => ({
          id: o.id,
          orderDate: new Date(o.created_at).toLocaleString("en-IN"),
          date: new Date(o.created_at).toLocaleDateString("en-IN"),
          time: new Date(o.created_at).toLocaleTimeString("en-IN"),
          buyerName: o.shipping_address?.full_name || "Customer",
          fulfillmentMethod: "Seller", salesChannel: "Partly", customerType: null,
          image: item.image || "",
          productName: item.name || "Product",
          asin: item.partNumber || (item.id ? String(item.id).slice(0, 8).toUpperCase() : ""),
          sku: item.size || "",
          quantity: item.quantity || 1,
          subtotal: (item.price || 0) * (item.quantity || 1),
          orderType: o.payment_method === "cod" ? "Cash on Delivery" : "Online",
          shipByDate: "", deliverByDate: "", addressType: "Residential",
          status, tab,
          cancellationReason: o.cancellation_reason || "",
          cancelledBy: o.cancelled_by || undefined,
          cancelledAt: o.cancelled_at || o.updated_at || o.created_at,
          confirmedAt: o.confirmed_at, shippedAt: o.shipped_at,
          deliveryPartner: o.delivery_partner || "",
          trackingNumber: o.tracking_number || "",
          shippingAddress: o.shipping_address,
          allItems: items.length > 0 ? [item] : [],
        })
        if (items.length === 0) {
          return [makeRow({ name: "Product", image: "", price: o.total_amount || 0, quantity: 1 })]
        }
        return items.map((item: any) => makeRow(item))
      })
      setOrders(mapped)
    } catch (err) { console.error("fetchOrders threw:", err) } finally {
      setLoadingOrders(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    // Listen for new order notification from sidebar polling
    // Debounce + skip if action happened recently (avoids flicker after confirm/cancel/process)
    let debounceTimer: ReturnType<typeof setTimeout>
    const onRefresh = () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        if (Date.now() - lastActionRef.current > 4000) {
          fetchOrders(false)
        }
      }, 1500)
    }
    window.addEventListener("refresh-orders", onRefresh)
    return () => {
      window.removeEventListener("refresh-orders", onRefresh)
      clearTimeout(debounceTimer)
    }
  }, [])

  useEffect(() => {
    const pendingItemCount = orders.filter(o => o.tab === "Pending").reduce((sum, o) => sum + (o.allItems?.length || 1), 0)
    setPendingCount(pendingItemCount)
  }, [orders, setPendingCount])

  const tabCounts = {
    Pending: orders.filter(o => o.tab === "Pending").length,
    Unshipped: orders.filter(o => o.tab === "Unshipped").length,
    Sent: orders.filter(o => o.tab === "Sent").length,
    Cancelled: orders.filter(o => o.tab === "Cancelled").length,
  }

  const sortedOrders = [...orders].sort((a, b) => {
    if (activeTab === "Cancelled" && a.cancelledAt && b.cancelledAt) {
      return new Date(b.cancelledAt).getTime() - new Date(a.cancelledAt).getTime()
    }
    if (activeTab === "Sent") {
      // Processed (not yet shipped) comes first
      if (a.status === "Processed" && b.status !== "Processed") return -1
      if (a.status !== "Processed" && b.status === "Processed") return 1
      // Within Shipped, sort by shippedAt descending (most recently shipped on top)
      if (a.shippedAt && b.shippedAt) {
        return new Date(b.shippedAt).getTime() - new Date(a.shippedAt).getTime()
      }
    }
    return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
  })

  const filteredOrders = sortedOrders.filter(o => {
    if (o.tab !== activeTab) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().replace("#", "")
      switch (searchType) {
        case "order-id": return o.id.toLowerCase().includes(q) || o.id.slice(0, 8).toLowerCase().includes(q)
        case "buyer-name": return (o.buyerName || "").toLowerCase().includes(q)
        case "sku": return (o.sku || "").toLowerCase().includes(q) || (o.asin || "").toLowerCase().includes(q) || (o.productName || "").toLowerCase().includes(q)
        default: return true
      }
    }
    return true
  })

  const toggleAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id))
    }
  }

  const toggleOne = (id: string) => {
    setSelectedOrders(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const confirmOrder = (id: string) => {
    lastActionRef.current = Date.now()
    // Optimistic update first — instant UI response
    setConfirmingIds(prev => new Set(prev).add(id))
    setOrders(prev => prev.map(o =>
      o.id === id ? { ...o, status: "Unshipped", tab: "Unshipped" } : o
    ))
    setSelectedOrders(prev => prev.filter(i => i !== id))
    // Fire API in background — no await, no delay
    updateOrderStatus(id, "confirmed").finally(() => {
      setConfirmingIds(prev => { const n = new Set(prev); n.delete(id); return n })
    })
  }

  const bulkConfirm = () => {
    const ids = selectedOrders.filter(id => orders.find(o => o.id === id && o.tab === "Pending"))
    ids.forEach(id => setConfirmingIds(prev => new Set(prev).add(id)))
    setOrders(prev => prev.map(o =>
      ids.includes(o.id) && o.tab === "Pending"
        ? { ...o, status: "Unshipped", tab: "Unshipped" } : o
    ))
    setSelectedOrders([])
    ids.forEach(id => updateOrderStatus(id, "confirmed").finally(() => {
      setConfirmingIds(prev => { const n = new Set(prev); n.delete(id); return n })
    }))
  }

  const processOrder = async (id: string) => {
    const partner = deliveryPartner === "Other" ? customPartner : deliveryPartner
    if (!partner || !trackingNumber) return
    setProcessingId(id)
    lastActionRef.current = Date.now()
    try {
      await updateOrderStatus(id, "processed", undefined, partner, trackingNumber)
      setProcessDialog(null)
      setDeliveryPartner("")
      setCustomPartner("")
      setTrackingNumber("")
      // Optimistic update — move to Sent immediately without re-fetching
      // (avoids flicker from the 3-second layout poll re-triggering fetchOrders)
      setOrders(prev => prev.map(o =>
        o.id === id ? { ...o, status: "Processed", tab: "Sent", deliveryPartner: partner, trackingNumber } : o
      ))
    } catch (err: any) {
      alert(err.message || "Failed to process order. Please try again.")
    } finally {
      setProcessingId(null)
    }
  }

  const cancelOrder = (id: string) => {
    if (!cancelReason.trim()) return
    lastActionRef.current = Date.now()
    updateOrderStatus(id, "cancelled", cancelReason)
    setOrders(prev => prev.map(o =>
      o.id === id ? { ...o, status: "Cancelled", tab: "Cancelled", cancellationReason: cancelReason, cancelledBy: "seller" } : o
    ))
    setCancelDialog(null)
    setCancelReason("")
    setSelectedOrders(prev => prev.filter(i => i !== id))
  }

  const bulkCancel = () => {
    if (!bulkCancelReason.trim()) return
    selectedOrders.filter(id => orders.find(o => o.id === id && o.tab === "Pending"))
      .forEach(id => updateOrderStatus(id, "cancelled"))
    setOrders(prev => prev.map(o =>
      selectedOrders.includes(o.id) && o.tab === "Pending"
        ? { ...o, status: "Cancelled", tab: "Cancelled", cancellationReason: bulkCancelReason, cancelledBy: "seller" } : o
    ))
    setSelectedOrders([])
    setBulkCancelDialog(false)
    setBulkCancelReason("")
  }

  const statusColor = (status: string) => {
    if (status === "Pending") return "bg-yellow-50 text-yellow-700 border-yellow-200"
    if (status === "Unshipped") return "bg-orange-50 text-orange-700 border-orange-200"
    if (status === "Ready to ship") return "bg-green-50 text-green-700 border-green-200"
    if (status === "Cancelled") return "bg-red-50 text-red-700 border-red-200"
    if (status === "Shipped") return "bg-blue-50 text-blue-700 border-blue-200"
    return "bg-gray-50 text-gray-700 border-gray-200"
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">

      {/* Process Dialog */}
      {processDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Process Order</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Delivery Partner</label>
                <select value={deliveryPartner} onChange={(e) => setDeliveryPartner(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select partner</option>
                  {deliveryPartners.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {deliveryPartner === "Other" && (
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Partner Name</label>
                  <input type="text" value={customPartner} onChange={(e) => setCustomPartner(e.target.value)}
                    placeholder="Enter delivery partner name"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Tracking Number</label>
                <input type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setProcessDialog(null); setDeliveryPartner(""); setTrackingNumber("") }}
                  className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={() => processOrder(processDialog)}
                  disabled={!deliveryPartner || !trackingNumber || (deliveryPartner === "Other" && !customPartner) || processingId === processDialog}
                  className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {processingId === processDialog ? "Processing..." : "Done"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Dialog */}
      {/* Item Cancel Dialog */}
      {itemCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setItemCancelDialog(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Cancel Item</h3>
            <p className="text-sm text-gray-500 line-clamp-2">"{itemCancelDialog.itemName}"</p>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Reason *</label>
              <textarea value={itemCancelReason} onChange={e => setItemCancelReason(e.target.value)}
                rows={3} placeholder="e.g. Out of stock, damaged..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setItemCancelDialog(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Back</button>
              <button onClick={() => {
                if (!itemCancelReason.trim()) return
                updateItemStatus(itemCancelDialog.orderId, itemCancelDialog.itemId, "cancelled", itemCancelReason)
                setItemCancelDialog(null)
                setItemCancelReason("")
              }} className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600">Cancel Item</button>
            </div>
          </div>
        </div>
      )}

      {cancelDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Cancel Order</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Reason for Cancellation</label>
                <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please describe why you are cancelling..." rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setCancelDialog(null); setCancelReason("") }}
                  className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">
                  Go Back
                </button>
                <button onClick={() => cancelOrder(cancelDialog)} disabled={!cancelReason.trim()}
                  className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-600 disabled:opacity-50">
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Cancel Dialog */}
      {bulkCancelDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Cancel {selectedOrders.length} Order(s)</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Reason for Cancellation</label>
                <textarea value={bulkCancelReason} onChange={(e) => setBulkCancelReason(e.target.value)}
                  placeholder="Please describe why you are cancelling..." rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setBulkCancelDialog(false); setBulkCancelReason("") }}
                  className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">
                  Go Back
                </button>
                <button onClick={bulkCancel} disabled={!bulkCancelReason.trim()}
                  className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-600 disabled:opacity-50">
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Manage Orders</h1>
          <div className="flex items-center gap-2">
            <select value={searchType} onChange={(e) => setSearchType(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="order-id">Order ID</option>
              <option value="buyer-name">Buyer Name</option>
              <option value="sku">SKU</option>
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Search..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56" />
            </div>
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}
                className="border border-red-200 text-red-500 px-3 py-2 rounded-lg text-sm hover:bg-red-50">
                Clear
              </button>
            )}
            <button onClick={() => fetchOrders(true)} className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50">
              <RefreshCw className={`h-4 w-4 ${loadingOrders ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center px-6 py-0 border-b border-gray-200 bg-white gap-6">
        {(["Pending", "Unshipped", "Cancelled", "Sent"] as const).map((tab) => (
          <button key={tab} onClick={() => { switchTab(tab); setSelectedOrders([]) }}
            className={`text-sm font-medium py-3 border-b-2 transition-colors ${
              activeTab === tab ? "text-blue-600 border-blue-600" : "text-gray-500 border-transparent hover:text-gray-900"
            }`}>
            <span className={`mr-1 ${tabCounts[tab] > 0 && activeTab === tab ? "text-blue-600" : "text-gray-400"}`}>
              {tabCounts[tab]}
            </span>
            {tab}
          </button>
        ))}
      </div>

      {/* Order count + date filter */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span className="text-base font-medium text-gray-900">{filteredOrders.length} orders</span>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
            className="border-0 text-sm text-gray-500 focus:outline-none bg-transparent cursor-pointer">
            <option value="All">All Orders</option>
            <option value="Last 30 minutes">Last 30 minutes</option>
            <option value="Last 1 hour">Last 1 hour</option>
            <option value="Today">Today</option>
            <option value="Last 7 days">Last 7 days</option>
            <option value="Last 14 days">Last 14 days</option>
            <option value="Last 30 days">Last 30 days</option>
            <option value="Last 60 days">Last 60 days</option>
            <option value="Last 90 days">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-6 py-2 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">Action on {selectedOrders.length} selected:</span>
          {activeTab === "Pending" && (
            <>
              <button disabled={selectedOrders.length === 0} onClick={bulkConfirm}
                className="text-xs text-green-600 hover:text-green-700 font-medium disabled:opacity-40">
                Confirm
              </button>
              <button disabled={selectedOrders.length === 0} onClick={() => setBulkCancelDialog(true)}
                className="text-xs text-red-500 hover:text-red-600 font-medium disabled:opacity-40">
                Cancel
              </button>
            </>
          )}
          {activeTab === "Unshipped" && (
            <>
              <button disabled={selectedOrders.length === 0} className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-40">Invoices</button>
              <button disabled={selectedOrders.length === 0} className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-40">Print Packing Slip(s)</button>
            </>
          )}
          {activeTab === "Sent" && (
            <button disabled={selectedOrders.length === 0} className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-40">Print Packing Slip(s)</button>
          )}
          {activeTab === "Cancelled" && (
            <span className="text-xs text-gray-400 italic">No actions available</span>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="w-8 py-3 px-4">
                  <input type="checkbox"
                    checked={filteredOrders.length > 0 && selectedOrders.length === filteredOrders.length}
                    onChange={toggleAll} className="rounded border-gray-300 cursor-pointer" />
                </th>
                <th className="text-left text-xs font-medium text-gray-500 py-3 px-2">Order date</th>
                <th className="text-left text-xs font-medium text-gray-500 py-3 px-2">Order details</th>
                <th className="text-left text-xs font-medium text-gray-500 py-3 px-2">Image</th>
                <th className="text-left text-xs font-medium text-gray-500 py-3 px-2 max-w-[200px]">Product name</th>
                <th className="text-left text-xs font-medium text-gray-500 py-3 px-2">Order type</th>
                <th className="text-left text-xs font-medium text-gray-500 py-3 px-2">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 py-3 px-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order, orderIdx) => (
                <tr key={`${order.id}-${orderIdx}`} className="border-b border-gray-100 hover:bg-gray-50 align-top">
                  <td className="pt-4 px-4">
                    <input type="checkbox" checked={selectedOrders.includes(order.id)}
                      onChange={() => toggleOne(order.id)} className="rounded border-gray-300 cursor-pointer" />
                  </td>
                  <td className="py-3 px-2">
                    <p className="text-xs font-medium text-gray-900">{order.orderDate}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{order.date}</p>
                    <p className="text-[10px] text-gray-400">{order.time}</p>
                  </td>
                  <td className="py-3 px-2">
                    <p className="text-xs font-medium text-blue-600">#{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-[10px] text-gray-300 font-mono">{order.id}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Buyer name:</p>
                    <p className="text-[10px] text-blue-600">{order.buyerName}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Fulfillment: {order.fulfillmentMethod}</p>
                    <p className="text-[10px] text-gray-400">Channel: {order.salesChannel}</p>
                    {order.customerType && (
                      <span className="mt-1.5 inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 font-medium">
                        {order.customerType}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2" colSpan={2}>
                    {order.allItems && order.allItems.length > 0 ? (
                      <div className="space-y-2">
                        {order.allItems.slice(0, (order.tab === "Pending" && !expandedOrders.has(order.id + orderIdx)) ? 1 : order.allItems.length).map((item: any, ii: number) => (
                          <div key={ii} className={`flex items-start gap-3 ${ii > 0 ? "pt-2 border-t border-gray-100" : ""}`}>
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : <Package className="h-4 w-4 text-gray-300 m-auto mt-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-blue-600 line-clamp-2">{item.name}</p>
                              {item.size && <span className="inline-block text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold mt-0.5">Size: {item.size}</span>}
                              {item.partNumber && <p className="text-[10px] text-gray-400">Part No: {item.partNumber.slice(0,8).toUpperCase()}</p>}
                              <p className="text-[10px] text-gray-400">Qty: {item.quantity} · ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString("en-IN")}</p>
                              {/* Item-level actions — only show when expanded and order is pending/unshipped */}
                              {expandedOrders.has(order.id + orderIdx) && order.tab === "Pending" && (order.allItems?.length ?? 0) > 1 && (
                                <div className="flex gap-1.5 mt-1.5">
                                  {order.tab === "Pending" && item.status !== "confirmed" && (
                                    <button onClick={(e) => { e.stopPropagation(); updateItemStatus(order.id, String(item.id || ""), "confirmed") }}
                                      className="text-[10px] bg-green-600 text-white px-3 py-1.5 rounded font-medium hover:bg-green-700">
                                      Confirm
                                    </button>
                                  )}
                                  {item.status === "confirmed" && (
                                    <span className="text-[10px] bg-green-100 text-green-700 px-3 py-1.5 rounded font-medium">✓ Confirmed</span>
                                  )}
                                  <button onClick={(e) => { e.stopPropagation(); setItemCancelDialog({ orderId: order.id, itemId: String(item.id || ""), itemName: String(item.name || "") }); setItemCancelReason("") }}
                                    className="text-[10px] bg-red-500 text-white px-3 py-1.5 rounded font-medium hover:bg-red-600">
                                    Cancel Item
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {order.tab === "Pending" && order.allItems.length > 1 && (
                          <button onClick={() => toggleExpand(order.id + orderIdx)}
                            className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-700 font-medium">
                            {expandedOrders.has(order.id + orderIdx)
                              ? <><ChevronUp className="h-3 w-3" /> Show less</>
                              : <><ChevronDown className="h-3 w-3" /> +{order.allItems.length - 1} more item{order.allItems.length > 2 ? "s" : ""}</>
                            }
                          </button>
                        )}
                        <p className="text-[10px] text-gray-500 font-medium">Total: ₹{order.subtotal.toLocaleString("en-IN")}</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {order.image ? <img src={order.image} alt="" className="w-full h-full object-cover" /> : <Package className="h-4 w-4 text-gray-300" />}
                        </div>
                        <div>
                          <p className="text-xs text-blue-600 line-clamp-2">{order.productName}</p>
                          {order.sku && <span className="inline-block text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold mt-0.5">Size: {order.sku}</span>}
                          {order.asin && <p className="text-[10px] text-gray-400">Part No: {order.asin}</p>}
                          <p className="text-[10px] text-gray-400">Qty: {order.quantity} · ₹{order.subtotal.toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <p className="text-xs font-medium text-gray-900">{order.orderType}</p>
                    {order.confirmedAt
                      ? <p className="text-[10px] text-gray-400 mt-0.5">Confirmed: {new Date(order.confirmedAt).toLocaleString("en-IN", {day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</p>
                      : <p className="text-[10px] text-gray-400 mt-0.5">Confirmed: —</p>
                    }
                    {order.shippedAt && (
                      <p className="text-[10px] text-gray-400">Shipped: {new Date(order.shippedAt).toLocaleString("en-IN", {day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</p>
                    )}
                    <p className="text-[10px] text-gray-400">Address: {order.addressType}</p>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`text-[10px] px-2 py-1 rounded-full border font-medium ${statusColor(order.status)}`}>
                      {order.status}
                    </span>
                    {order.deliveryPartner && <p className="text-[10px] text-gray-500 mt-1">{order.deliveryPartner}</p>}
                    {order.trackingNumber && <p className="text-[10px] text-blue-600 mt-0.5">{order.trackingNumber}</p>}
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex flex-col gap-1.5">
                      {activeTab === "Pending" && (
                        <>
                          <button onClick={() => confirmOrder(order.id)}
                            disabled={confirmingIds.has(order.id)}
                            className="text-[10px] bg-green-600 text-white px-3 py-1.5 rounded font-medium hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed">
                            {confirmingIds.has(order.id) ? "Confirming..." : "Confirm"}
                          </button>
                          <button onClick={() => setCancelDialog(order.id)}
                            className="text-[10px] bg-red-500 text-white px-3 py-1.5 rounded font-medium hover:bg-red-600">
                            Cancel
                          </button>
                        </>
                      )}
                      {activeTab === "Unshipped" && (
                        <>
                          <button onClick={() => setProcessDialog(order.id)}
                            className="text-[10px] bg-blue-600 text-white px-3 py-1.5 rounded font-medium hover:bg-blue-700">
                            Process
                          </button>
                          <button className="text-[10px] border border-gray-200 text-gray-600 px-3 py-1.5 rounded font-medium hover:bg-gray-50 flex items-center gap-1">
                            <Printer className="h-3 w-3" /> Packing slip
                          </button>
                          <button className="text-[10px] text-blue-600 hover:underline font-medium flex items-center gap-1">
                            <FileText className="h-3 w-3" /> Invoice
                          </button>
                        </>
                      )}
                      {activeTab === "Sent" && (
                        <>
                          <span className="text-[10px] bg-gray-100 text-gray-400 border border-gray-200 px-2 py-1 rounded font-medium text-center cursor-default">
                            Processed ✓
                          </span>
                          {order.status === "Shipped" || order.status === "Delivered" ? (
                            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded font-medium text-center">
                              Shipped ✓
                            </span>
                          ) : (
                            <button
                              onClick={async () => {
                                try {
                                  await updateOrderStatus(order.id, "shipped")
                                  fetchOrders(false)
                                } catch { alert("Failed to update. Please try again.") }
                              }}
                              className="text-[10px] bg-blue-600 text-white px-3 py-1.5 rounded font-medium hover:bg-blue-700">
                              Ship
                            </button>
                          )}
                        </>
                      )}
                      {activeTab === "Cancelled" && (
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <button
                              onClick={(e) => { setReasonPopupRect(e.currentTarget.getBoundingClientRect()); setReasonPopup(reasonPopup === order.id ? null : order.id) }}
                              className={`text-[10px] px-2 py-1 rounded-full border font-medium ${
                                order.cancelledBy === "seller"
                                  ? "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                                  : "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                              }`}
                            >
                              Info
                            </button>
                            {reasonPopup === order.id && reasonPopupRect && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setReasonPopup(null)} />
                                <div className="fixed z-50 w-56 bg-white border border-gray-200 rounded-xl shadow-xl p-3"
                                  style={{ top: reasonPopupRect.top - 100, left: reasonPopupRect.left - 180 }}>
                                  <p className="text-xs font-semibold text-gray-700 mb-1">Cancellation Reason</p>
                                  <p className="text-xs text-gray-500">{order.cancellationReason || "No reason provided"}</p>
                                  <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                                    <p className="text-[10px] text-gray-400">Cancelled by: <span className="font-medium capitalize">{order.cancelledBy || "unknown"}</span></p>
                                    {order.cancelledAt && (
                                      <p className="text-[10px] text-gray-400">Cancelled on: <span className="font-medium">{new Date(order.cancelledAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span></p>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOrders.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-gray-400 text-sm">No orders in this tab</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}