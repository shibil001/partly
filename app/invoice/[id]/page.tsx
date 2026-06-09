"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        const found = (data.orders || []).find((o: any) => o.id === id)
        setOrder(found || null)
      } catch {}
      setLoading(false)
    }
    fetchOrder()
  }, [id])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
  if (!order) return <div className="min-h-screen flex items-center justify-center text-gray-500">Invoice not found</div>

  const addr = order.shipping_address || {}
  const orderDate = new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-lg overflow-hidden print:shadow-none print:rounded-none print:max-w-full">

        {/* Header */}
        <div className="bg-blue-600 px-8 py-6 text-white flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">PARTLY</h1>
            <p className="text-blue-200 text-sm mt-0.5">Auto Parts Marketplace</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">INVOICE</p>
            <p className="text-blue-200 text-sm font-mono">#{id.slice(0,8).toUpperCase()}</p>
            <p className="text-blue-200 text-xs mt-1">{orderDate}</p>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">

          {/* Bill To */}
          <div className="flex justify-between gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Bill To</p>
              <p className="text-sm font-semibold text-gray-900">{addr.full_name || "—"}</p>
              <p className="text-xs text-gray-500">{addr.address}</p>
              <p className="text-xs text-gray-500">{addr.city}, {addr.state} - {addr.pincode}</p>
              <p className="text-xs text-gray-500">{addr.phone}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Payment</p>
              <p className="text-sm text-gray-700">{order.payment_method === "cod" ? "Cash on Delivery" : order.payment_method || "COD"}</p>
              <p className="text-xs text-gray-400 mt-1">Status: <span className={`font-medium capitalize ${order.status === "cancelled" ? "text-red-500" : "text-green-600"}`}>{order.status}</span></p>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Item</th>
                  <th className="text-center py-2 text-xs font-semibold text-gray-500 uppercase w-16">Qty</th>
                  <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase w-24">Price</th>
                  <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase w-24">Total</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item: any, i: number) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-gray-800 line-clamp-2">{item.name}</p>
                      {item.size && <p className="text-xs text-gray-400">Size: {item.size}</p>}
                    </td>
                    <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                    <td className="py-3 text-right text-gray-600">₹{(item.price || 0).toLocaleString("en-IN")}</td>
                    <td className="py-3 text-right font-medium text-gray-800">₹{((item.price || 0) * (item.quantity || 1)).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-56 space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>₹{(order.total_amount || 0).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Delivery</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t-2 border-gray-200">
                <span>Total</span>
                <span>₹{(order.total_amount || 0).toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="border-t border-gray-100 pt-4 text-xs text-gray-400 text-center">
            Thank you for shopping with Partly · This is a computer-generated invoice
          </div>
        </div>

        {/* Print / Close buttons */}
        <div className="px-8 pb-6 flex gap-3 print:hidden">
          <button onClick={() => window.print()}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
            Print / Save PDF
          </button>
          <button onClick={() => window.close()}
            className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}