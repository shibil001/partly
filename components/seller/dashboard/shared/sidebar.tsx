"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { useOrders } from "@/contexts/orders-context"
import {
  LayoutDashboard, ShoppingCart, BarChart3, Users,
  Package, Store, HelpCircle, Settings, LogOut,
  ChevronLeft, ChevronDown, ClipboardList, Sun, Moon,
} from "lucide-react"

const getMenuItems = (pendingCount: number, isUsed: boolean) => [
  { icon: LayoutDashboard, label: "Dashboard", href: isUsed ? "/seller/used-dashboard" : "/seller/dashboard" },
  { icon: ShoppingCart, label: "Orders", href: "/seller/orders", badge: pendingCount },
  ...(!isUsed ? [{ icon: BarChart3, label: "Sales Performance", href: "/seller/sales" }] : []),
]

const getManagementItems = (isUsed: boolean, messageCount: number) => [
  { icon: Users, label: "Customers", href: "/seller/customers", badge: messageCount },
  { icon: Package, label: "Products", href: isUsed ? "/seller/used-products" : "/seller/products" },
  ...(!isUsed ? [{ icon: ClipboardList, label: "Inventory", href: "/seller/inventory" }] : []),
  { icon: Store, label: "Shop Profile", href: "/seller/shop" },
]

const bottomItems = [
  { icon: HelpCircle, label: "Help Center", href: "/seller/help" },
]

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

export function SellerSidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [managementOpen, setManagementOpen] = useState(true)
  const [shopName, setShopName] = useState("Seller Dashboard")
  const [shopInitial, setShopInitial] = useState("S")
  const [shopUsername, setShopUsername] = useState("")
  const [shopLogoUrl, setShopLogoUrl] = useState("")
  const [darkMode, setDarkMode] = useState(false)
  const [isUsed, setIsUsed] = useState(false)
  const { pendingCount } = useOrders()
  const [messageCount, setMessageCount] = useState(0)

  // Poll + realtime for unread message/offer count
  useEffect(() => {
    const fetchMessageCount = async () => {
      try {
        const token = localStorage.getItem("seller_token")
        if (!token) return
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/count`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setMessageCount(data.count || 0)
        }
      } catch {}
    }
    fetchMessageCount()
    const interval = setInterval(fetchMessageCount, 30000)
    window.addEventListener("messages-change", fetchMessageCount)

    // Realtime — instant count update when new message arrives
    let channel: any = null
    try {
      const stored = JSON.parse(localStorage.getItem("seller_user") || "{}")
      const sellerId = stored?.id
      if (sellerId) {
        channel = supabase
          .channel(`sidebar-messages-${sellerId}`)
          .on("postgres_changes", {
            event: "INSERT",
            schema: "public",
            table: "messages",
          }, (payload: any) => {
            const msg = payload.new
            if (msg?.recipient_id === sellerId) {
              setMessageCount(prev => prev + 1)
              window.dispatchEvent(new Event("messages-change"))
            }
          })
          .subscribe()
      }
    } catch {}

    return () => {
      clearInterval(interval)
      window.removeEventListener("messages-change", fetchMessageCount)
      if (channel) supabase.removeChannel(channel)
    }
  }, [])
  const menuItems = getMenuItems(pendingCount, isUsed)
  const managementItems = getManagementItems(isUsed, messageCount)

  const toggleDarkMode = () => {
    setDarkMode(v => {
      const next = !v
      document.documentElement.classList.toggle("dark", next)
      localStorage.setItem("seller_dark_mode", next ? "1" : "0")
      return next
    })
  }

  const handleLogout = () => {
    localStorage.removeItem("seller_token")
    localStorage.removeItem("seller_user")
    localStorage.removeItem("seller_shop")
    router.push("/seller")
  }

  useEffect(() => {
    // Instant load from localStorage
    try {
      const storedShop = JSON.parse(localStorage.getItem("seller_shop") || "{}")
      if (storedShop?.shop_name) {
        setShopName(storedShop.shop_name)
        setShopInitial(storedShop.shop_name[0].toUpperCase())
      }
      if (storedShop?.shop_username) setShopUsername(storedShop.shop_username)
      if (storedShop?.product_condition) setIsUsed(storedShop.product_condition === 'used')
      if (storedShop?.logo_url) setShopLogoUrl(storedShop.logo_url)
    } catch {}

    // Fetch fresh from backend
    const token = localStorage.getItem("seller_token")
    if (!token) return
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sellers/shop`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.shop?.shop_name) {
          setShopName(data.shop.shop_name)
          setShopInitial(data.shop.shop_name[0].toUpperCase())
          if (data.shop.shop_username) setShopUsername(data.shop.shop_username)
          if (data.shop.logo_url) setShopLogoUrl(data.shop.logo_url)
          localStorage.setItem("seller_shop", JSON.stringify(data.shop))
        }
      })
      .catch(() => {})
  }, [])

  return (
    <aside className={cn(
      "flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300",
      collapsed ? "w-20" : "w-64"
    )}>
      {/* Logo + Shop Name */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-blue-100">
          {shopLogoUrl ? (
            <img src={shopLogoUrl} alt={shopName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-bold text-sm">{shopInitial}</span>
          )}
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 truncate text-sm leading-tight">{shopName}</h1>
            <p className="text-xs text-gray-500 truncate">Seller Dashboard</p>
          </div>
        )}
        <button onClick={onToggle} className="p-1 rounded hover:bg-gray-100 shrink-0">
          <ChevronLeft className={cn("w-4 h-4 text-gray-500 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-sm font-medium">{item.label}</span>
                  {item.badge ? (
                    <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                      {item.badge}
                    </span>
                  ) : null}
                </>
              )}
            </Link>
          )
        })}

        {/* Management Section */}
        {!collapsed && (
          <div className="pt-4">
            <button
              onClick={() => setManagementOpen(!managementOpen)}
              className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider"
            >
              Management
              <ChevronDown className={cn("w-4 h-4 transition-transform", !managementOpen && "-rotate-90")} />
            </button>
          </div>
        )}

        {(managementOpen || collapsed) && (
          <div className="space-y-1">
            {managementItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-sm font-medium">{item.label}</span>
                      {(item as any).badge ? (
                        <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                          {(item as any).badge}
                        </span>
                      ) : null}
                    </>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </nav>

      {/* Bottom */}
      <div className="p-3 space-y-1 border-t border-gray-200">

        {/* Help Center */}
        <Link href="/seller/help"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
          <HelpCircle className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Help Center</span>}
        </Link>

        {/* Settings */}
        <Link href="/seller/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
          <Settings className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Settings</span>}
        </Link>

        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors w-full"
        >
          {darkMode ? <Sun className="w-5 h-5 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
          {!collapsed && <span className="text-sm font-medium">{darkMode ? "Light Mode" : "Dark Mode"}</span>}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors w-full"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  )
}