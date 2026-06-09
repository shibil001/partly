"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ProductsProvider } from "@/contexts/products-context"
import { OrdersProvider, useOrders } from "@/contexts/orders-context"
import { supabase } from "@/lib/supabase"

const PUBLIC_SELLER_PATHS = ["/seller", "/seller/login"]

function OrderPoller() {
  const { setPendingCount } = useOrders()
  const intervalRef = useRef<any>(null)
  const channelRef = useRef<any>(null)
  const isFetching = useRef(false)

  useEffect(() => {
    const fetchPending = async () => {
      if (isFetching.current) return
      isFetching.current = true
      try {
        const token = localStorage.getItem("seller_token")
        if (!token) return
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/seller`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) return
        const data = await res.json()
        if (data?.orders) {
          const pendingOrders = data.orders.filter((o: any) => o.status === "pending")
          const pending = pendingOrders.reduce((sum: number, o: any) => {
            const itemCount = Array.isArray(o.items) ? o.items.length : 1
            return sum + itemCount
          }, 0)
          setPendingCount(pending)
          localStorage.setItem("seller_pending_count", String(pending))
          // Refresh orders list if on orders page
          const path = window.location.pathname
          if (path.includes("/seller/orders") || path.includes("/seller/used-orders")) {
            window.dispatchEvent(new Event("refresh-orders"))
          }
        }
      } catch {} finally {
        isFetching.current = false
      }
    }

    fetchPending()
    intervalRef.current = setInterval(fetchPending, 3000)

    // Realtime
    try {
      const sellerUser = JSON.parse(localStorage.getItem("seller_user") || "{}")
      const sellerId = sellerUser?.id
      if (sellerId) {
        channelRef.current = supabase
          .channel(`layout_orders_${sellerId}`)
          .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload: any) => {
            if (payload.new?.seller_id === sellerId) fetchPending()
          })
          .subscribe()
      }
    } catch {}

    return () => {
      clearInterval(intervalRef.current)
      try { if (channelRef.current) supabase.removeChannel(channelRef.current) } catch {}
    }
  }, [])

  return null
}

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [authorized, setAuthorized] = useState(false)
  const [shopStatus, setShopStatus] = useState<any>(null)
  const isPublicPath = PUBLIC_SELLER_PATHS.includes(pathname)

  useEffect(() => {
    if (isPublicPath) { setAuthorized(true); return }
    try {
      const token = localStorage.getItem("seller_token")
      const user = JSON.parse(localStorage.getItem("seller_user") || "{}")
      if (!token || user?.role !== "seller") { router.replace("/seller/login"); return }
      // Check shop suspension status via API (uses service role key, bypasses RLS)
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sellers/shop`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => {
          const shop = data?.shop
          if (shop?.status === "suspended") {
            setShopStatus(shop)
          } else {
            setShopStatus(null)
          }
          setAuthorized(true)
        })
        .catch(() => setAuthorized(true))
    } catch { router.replace("/seller/login") }
  }, [pathname])

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isPublicPath) return <>{children}</>

  // Show suspension banner but allow dashboard access
  if (shopStatus?.status === "suspended") {
    return (
      <OrdersProvider>
        <ProductsProvider>
          <OrderPoller />
          {/* Suspension banner — stays fixed, no dismiss */}
          <div className="bg-red-600 text-white px-4 py-3 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-bold text-sm">Your shop is suspended — public shop & products are hidden</p>
                  <p className="text-red-200 text-xs">Reason: {shopStatus.suspension_reason || "Violation of Partly terms"} · Contact support to resolve this issue</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a href="/seller/help"
                  className="text-xs font-bold px-4 py-1.5 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-all"
                  style={{ textDecoration: "none" }}>
                  Contact Support
                </a>
              </div>
            </div>
          </div>
          {children}
        </ProductsProvider>
      </OrdersProvider>
    )
  }

  return (
    <OrdersProvider>
      <ProductsProvider>
        <OrderPoller />
        {children}
      </ProductsProvider>
    </OrdersProvider>
  )
}