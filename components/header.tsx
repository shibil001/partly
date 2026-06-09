"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  Menu, ShoppingCart, CircleUserRound, ChevronDown, User, Package,
  Heart, LogOut, X, Trash2, ShoppingBag, Search, Mic, Star, Bell, MessageCircle
} from "lucide-react"
import { LoginModal } from "@/components/login-modal"

async function syncWishlist(items: any[]) {
  try {
    const token = localStorage.getItem("token")
    if (!token) return
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wishlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ items }),
    })
  } catch {}
}

async function fetchWishlistFromServer() {
  try {
    const token = localStorage.getItem("token")
    if (!token) return null
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wishlist`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.items || []
  } catch { return null }
}

interface UserData {
  name?: string
  full_name?: string
  username?: string
  email?: string
  role?: string
  avatar_url?: string
}

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  size?: string | null
}

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const isHome = pathname === "/"
  const [menuOpen, setMenuOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  // Search
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchError, setSearchError] = useState("")
  const [searchCategory, setSearchCategory] = useState<string | null>(null)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [starredCondition, setStarredCondition] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const cartRef = useRef<HTMLDivElement>(null)
  const cartPanelRef = useRef<HTMLDivElement>(null)

  const loadUser = () => {
    try {
      const stored = localStorage.getItem("user")
      setUser(stored ? JSON.parse(stored) : null)
      if (stored) {
        loadCounts()
        // Load wishlist from server and sync to localStorage
        fetchWishlistFromServer().then(serverItems => {
          if (serverItems && serverItems.length > 0) {
            localStorage.setItem("wishlist", JSON.stringify(serverItems))
            window.dispatchEvent(new Event("wishlist-change"))
          }
        })
      }
    } catch { setUser(null) }
  }

  const loadCart = () => {
    try {
      const stored = localStorage.getItem("cart")
      setCartItems(stored ? JSON.parse(stored) : [])
    } catch { setCartItems([]) }
  }

  const loadCounts = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) { setUnreadNotifications(0); setUnreadMessages(0); return }
      const [nRes, mRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/count`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/count`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      const [nData, mData] = await Promise.all([nRes.json(), mRes.json()])
      setUnreadNotifications(nData.count || 0)
      setUnreadMessages(mData.count || 0)
    } catch {}
  }

  useEffect(() => {
    loadUser()
    loadCart()
    loadCounts()
    const saved = localStorage.getItem("partly_preferred_condition")
    if (saved) { setStarredCondition(saved); setSearchCategory(saved) }
    window.addEventListener("focus", loadUser)
    window.addEventListener("auth-change", loadUser)
    window.addEventListener("cart-change", loadCart)
    window.addEventListener("notifications-change", loadCounts)
    window.addEventListener("messages-change", loadCounts)
    const handleOpenCart = () => setCartOpen(true)
    window.addEventListener("open-cart", handleOpenCart)
    // Open login modal when buyer session expires
    const handleAuthExpired = () => setLoginOpen(true)
    window.addEventListener("auth-expired", handleAuthExpired)
    return () => {
      window.removeEventListener("focus", loadUser)
      window.removeEventListener("auth-change", loadUser)
      window.removeEventListener("cart-change", loadCart)
      window.removeEventListener("notifications-change", loadCounts)
      window.removeEventListener("messages-change", loadCounts)
      window.removeEventListener("open-cart", handleOpenCart)
      window.removeEventListener("auth-expired", handleAuthExpired)
    }
  }, [])

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
      if (cartRef.current && !cartRef.current.contains(e.target as Node) && cartPanelRef.current && !cartPanelRef.current.contains(e.target as Node)) setCartOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleLogout = async () => {
    // Save cart to backend before clearing
    try {
      const token = localStorage.getItem("token")
      const cart = localStorage.getItem("cart")
      if (token && cart) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ items: JSON.parse(cart) }),
        })
      }
    } catch {}
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    localStorage.removeItem("cart")
    localStorage.removeItem("wishlist")
    localStorage.removeItem("recently_viewed")
    localStorage.removeItem("recent_searches")
    localStorage.removeItem("recent_orders")
    setUser(null)
    setCartItems([])
    setDropdownOpen(false)
    setCartOpen(false)
    window.location.href = "/"
  }

  const handleLoginClose = () => {
    setLoginOpen(false)
    loadUser()
  }

  const removeFromCart = (id: string, size?: string | null) => {
    const updated = cartItems.filter(item => !(item.id === id && item.size === size))
    setCartItems(updated)
    localStorage.setItem("cart", JSON.stringify(updated))
    window.dispatchEvent(new Event("cart-change"))
  }

  const updateQuantity = (id: string, size: string | null | undefined, delta: number) => {
    const updated = cartItems.map(item => {
      if (item.id === id && item.size === size) {
        const newQty = item.quantity + delta
        if (newQty <= 0) return null
        return { ...item, quantity: newQty }
      }
      return item
    }).filter(Boolean) as CartItem[]
    setCartItems(updated)
    localStorage.setItem("cart", JSON.stringify(updated))
    window.dispatchEvent(new Event("cart-change"))
  }

  const moveToSaved = (item: CartItem) => {
    // Remove from cart
    const updatedCart = cartItems.filter(i => !(i.id === item.id && i.size === item.size))
    setCartItems(updatedCart)
    localStorage.setItem("cart", JSON.stringify(updatedCart))
    window.dispatchEvent(new Event("cart-change"))
    // Add to wishlist
    try {
      const stored = localStorage.getItem("wishlist")
      const wishlist = stored ? JSON.parse(stored) : []
      const exists = wishlist.find((w: any) => w.id === item.id && w.size === item.size)
      if (!exists) {
        wishlist.push({ id: item.id, name: item.name, price: item.price, image: item.image, size: item.size })
        localStorage.setItem("wishlist", JSON.stringify(wishlist))
        window.dispatchEvent(new Event("wishlist-change"))
        syncWishlist(wishlist)
      }
    } catch {}
  }

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchError("Type something to search")
      searchInputRef.current?.focus()
      return
    }
    setSearchError("")
    setSearchOpen(false)
    setCategoryOpen(false)
    // Track search via API if logged in
    try {
      const token = localStorage.getItem("token")
      if (token) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/activity/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ query: searchQuery.trim(), condition: searchCategory })
        })
      }
    } catch {}
    const params = new URLSearchParams({ q: searchQuery.trim() })
    if (searchCategory) params.set("condition", searchCategory)
    router.push(`/search?${params.toString()}`)
  }

  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0)
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const displayName = user?.username || user?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Account"

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">

          {/* Logo */}
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">PARTLY</span>
          </a>

          {/* Middle — nav fades, search expands */}
          <div className="flex-1 flex items-center justify-center mx-4 relative">

            {/* Nav — fades out when search opens */}
            <nav className={`hidden md:flex items-center gap-8 transition-all duration-300 ${searchOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
              <a href="/coming-soon" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Auctions</a>
            <a href="http://localhost:3001" target="_blank" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Raffle</a>
              <a href="/seller" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Sell</a>
              <a href="/requests" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Requests</a>
              <a href="/market" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Market</a>
            </nav>

            {/* Search bar — expands to w-[85%] from right, exactly as original */}
            <div
              className={`absolute right-0 top-1/2 -translate-y-1/2 flex items-center bg-white border border-gray-200 rounded-xl transition-all duration-300 ease-out ${
                searchOpen ? "w-[85%] opacity-100" : "w-0 opacity-0 pointer-events-none"
              }`}
              style={{ overflow: searchOpen ? "visible" : "hidden" }}
            >
              {/* Category dropdown — New / Used / All */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setCategoryOpen(!categoryOpen)}
                  className="h-10 px-4 flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors border-r border-gray-200"
                >
                  {searchCategory === "new" ? "New" : searchCategory === "used" ? "Used" : "All"}
                  <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${categoryOpen ? "rotate-180" : ""}`} />
                </button>
                {categoryOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setCategoryOpen(false)} />
                    <div className="absolute top-full left-0 mt-2 w-28 bg-white rounded-xl border border-gray-100 shadow-xl z-50 py-1.5">
                      {[
                        { value: "new", label: "New" },
                        { value: "used", label: "Used" },
                        { value: "all", label: "All" },
                      ].map((opt) => (
                        <div key={opt.value} className="flex items-center px-3 gap-1">
                          <button
                            onClick={() => { setSearchCategory(opt.value); setCategoryOpen(false) }}
                            className={`flex-1 text-left py-2 text-xs transition-colors ${
                              searchCategory === opt.value
                                ? "text-blue-600 font-semibold"
                                : "text-gray-600 hover:bg-gray-50 font-medium"
                            }`}
                          >
                            {opt.label}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (starredCondition === opt.value) {
                                setStarredCondition(null)
                                setSearchCategory(null)
                                localStorage.removeItem("partly_preferred_condition")
                              } else {
                                setStarredCondition(opt.value)
                                setSearchCategory(opt.value)
                                localStorage.setItem("partly_preferred_condition", opt.value)
                              }
                            }}
                            title={starredCondition === opt.value ? "Remove default" : "Set as default"}
                            className="p-1 transition-colors flex-shrink-0"
                          >
                            <Star className={`h-3 w-3 transition-all ${
                              starredCondition === opt.value
                                ? "fill-blue-500 text-blue-500"
                                : "text-gray-300 hover:text-blue-400"
                            }`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <Search className={`h-4 w-4 ml-3 flex-shrink-0 ${searchError ? "text-red-400" : "text-gray-400"}`} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={searchError || "Search parts, vehicles..."}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); if (searchError) setSearchError("") }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch()
                  if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); setSearchError(""); setCategoryOpen(false) }
                }}
                className={`flex-1 h-10 px-3 bg-transparent border-none outline-none text-sm text-gray-900 min-w-0 ${searchError ? "placeholder:text-red-400" : "placeholder:text-gray-400"}`}
              />
              <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0">
                <Mic className="h-4 w-4" />
              </button>
              <button
                onClick={handleSearch}
                className="h-10 px-4 bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors flex-shrink-0 rounded-r-xl"
              >
                Search
              </button>
            </div>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-1 flex-shrink-0">

            {/* Search toggle — hidden on home page since it has its own search bar */}
            {!isHome && (
              <button
                onClick={() => {
                  setSearchOpen(v => !v)
                  setSearchQuery("")
                  setSearchError("")
                  setCategoryOpen(false)
                  setDropdownOpen(false)
                  setCartOpen(false)
                }}
                className={`p-2 transition-colors ${searchOpen ? "text-blue-600" : "text-gray-500 hover:text-blue-600"}`}
              >
                {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
              </button>
            )}

            {/* Cart Dropdown */}
            <div className="relative" ref={cartRef}>
              <button
                onClick={() => { setCartOpen(v => !v); setDropdownOpen(false); setSearchOpen(false) }}
                className="relative p-2 text-gray-500 hover:text-blue-600 transition-colors"
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              </button>

            </div>

            {/* User dropdown */}
            {user ? (
              <div className="relative hidden md:block" ref={dropdownRef}>
                <button
                  onClick={() => { setDropdownOpen(v => !v); setCartOpen(false); setSearchOpen(false) }}
                  className="relative flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center flex-shrink-0">
                    {user.avatar_url
                      ? <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                      : <CircleUserRound className="h-5 w-5 text-blue-600" />
                    }
                  </div>
                  {(unreadNotifications + unreadMessages) > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {unreadNotifications + unreadMessages > 9 ? "9+" : unreadNotifications + unreadMessages}
                    </span>
                  )}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform text-gray-400 ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Your Account</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">@{user.username || displayName}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <a href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <User className="h-4 w-4 text-gray-400" />My Profile
                      </a>
                      <a href="/orders" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Package className="h-4 w-4 text-gray-400" />My Orders
                      </a>
                      <a href="/wishlist" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Heart className="h-4 w-4 text-gray-400" />Wishlist
                      </a>
                      <a href="/messages" className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <span className="flex items-center gap-3"><MessageCircle className="h-4 w-4 text-gray-400" />Messages</span>
                        {unreadMessages > 0 && <span className="bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{unreadMessages}</span>}
                      </a>
                      <a href="/notifications" className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <span className="flex items-center gap-3"><Bell className="h-4 w-4 text-gray-400" />Notifications</span>
                        {unreadNotifications > 0 && <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{unreadNotifications}</span>}
                      </a>
                      <a href="/individual-seller" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Package className="h-4 w-4 text-gray-400" />My Listings
                      </a>
                    </div>
                    <div className="border-t border-gray-100 pt-1">
                      <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                        <LogOut className="h-4 w-4" />Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setLoginOpen(true)}
                className="p-2 text-gray-500 hover:text-blue-600 transition-colors hidden md:flex"
              >
                <CircleUserRound className="h-8 w-8" />
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-900"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white px-4 py-4 flex flex-col gap-4">
            {/* Mobile search */}
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
              <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search parts, vehicles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { handleSearch(); setMenuOpen(false) } }}
                className="flex-1 text-sm bg-transparent outline-none text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <a href="#" className="text-sm font-medium text-gray-600">Auctions</a>
            <a href="/seller" className="text-sm font-medium text-gray-600">Sell</a>
            <a href="/requests" className="text-sm font-medium text-gray-600">Requests</a>
            <a href="/market" className="text-sm font-medium text-gray-600">Market</a>
            {user ? (
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-400 mb-2">Signed in as <span className="font-medium text-gray-700">{displayName}</span></p>
                <a href="/profile" className="block text-sm text-gray-600 py-1">My Profile</a>
                <a href="/orders" className="block text-sm text-gray-600 py-1">My Orders</a>
                <a href="/wishlist" className="block text-sm text-gray-600 py-1">Wishlist</a>
                <a href="/checkout" className="block text-sm text-gray-600 py-1">Cart ({totalItems})</a>
                <button onClick={handleLogout} className="text-sm font-medium text-red-500 text-left mt-2">Logout</button>
              </div>
            ) : (
              <button
                onClick={() => { setLoginOpen(true); setMenuOpen(false) }}
                className="text-sm font-medium text-blue-600 text-left"
              >
                Sign In
              </button>
            )}
          </div>
        )}
      </header>

      {/* Cart slide panel */}
{cartOpen && <div className="fixed inset-0 bg-black/50 z-40" />}
      <div ref={cartPanelRef} className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col ${cartOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <p className="text-base font-semibold text-gray-900">My Cart</p>
          {totalItems > 0 && <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full ml-2">{totalItems}</span>}
        </div>
        <div className="flex-1 overflow-y-auto">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <ShoppingBag className="h-14 w-14 text-gray-200 mb-4" />
              <p className="text-base font-medium text-gray-500">Your cart is empty</p>
              <p className="text-sm text-gray-400 mt-1">Add parts to get started</p>
              <button onClick={() => setCartOpen(false)} className="mt-5 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">Browse Parts</button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 px-4">
              {cartItems.map(item => (
                <div key={`${item.id}-${item.size}`} className="flex items-start gap-3 py-4">
                  <a href={`/product/${item.id}`} onClick={() => setCartOpen(false)} className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden hover:opacity-80 transition-opacity">
                    {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="h-5 w-5 text-gray-300" /></div>}
                  </a>
                  <div className="flex-1 min-w-0">
                    <a href={`/product/${item.id}`} onClick={() => setCartOpen(false)} className="text-sm font-semibold text-gray-800 hover:text-blue-600 line-clamp-2 block leading-snug">{item.name}</a>
                    {item.size && <p className="text-xs text-gray-400 mt-0.5">Size: {item.size}</p>}
                    <p className="text-sm font-bold text-gray-900 mt-1">₹{((item.price || 0) * item.quantity).toLocaleString("en-IN")}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button onClick={() => updateQuantity(item.id, item.size, -1)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 text-sm font-bold">−</button>
                        <span className="text-sm font-medium text-gray-700 w-7 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.size, 1)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 text-sm font-bold">+</button>
                      </div>
                      <span className="text-xs text-gray-400">₹{(item.price || 0).toLocaleString("en-IN")} each</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => moveToSaved(item)} className="p-1.5 text-gray-300 hover:text-red-400 transition-colors"><Heart className="h-4 w-4" /></button>
                    <button onClick={() => removeFromCart(item.id, item.size)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {cartItems.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-5 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-xl font-bold text-gray-900">₹{totalPrice.toLocaleString("en-IN")}</p>
            </div>
            <a href="/checkout" onClick={() => setCartOpen(false)} className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold text-center py-3.5 rounded-xl transition-colors">Checkout</a>
          </div>
        )}
      </div>

      <LoginModal isOpen={loginOpen} onClose={handleLoginClose} />
    </>
  )
}