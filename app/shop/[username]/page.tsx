"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { mapDbToProduct } from "@/lib/supabase"
import {
  Store, MapPin, Phone, Mail, Package, Shield,
  Clock, Heart, ShoppingCart, CheckCircle, SlidersHorizontal, Search, X, ExternalLink,
  LayoutGrid, Tag, Info
} from "lucide-react"

type Product = ReturnType<typeof mapDbToProduct>

export default function ShopPage() {
  const params = useParams()
  const username = params.username as string

  const [shop, setShop] = useState<any>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [suspended, setSuspended] = useState<{ reason: string; deadline: string } | null>(null)
  const [activeTab, setActiveTab] = useState<"products" | "category" | "about">("products")
  const [wishlist, setWishlist] = useState<Set<string>>(new Set())
  const [following, setFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [sortBy, setSortBy] = useState<"default" | "price_asc" | "price_desc">("default")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [showAllProducts, setShowAllProducts] = useState(false)
  const [showAllPopular, setShowAllPopular] = useState(false)
  const [categorySearch, setCategorySearch] = useState("")

  useEffect(() => {
    const load = () => {
      try {
        const stored = JSON.parse(localStorage.getItem("wishlist") || "[]")
        setWishlist(new Set(stored.map((i: any) => i.id)))
      } catch {}
    }
    load()
    window.addEventListener("wishlist-change", load)
    return () => window.removeEventListener("wishlist-change", load)
  }, [])

  useEffect(() => {
    if (!username) return
    ;(async () => {
      setLoading(true)
      try {
        // Fetch shop via backend API so we always get the latest saved data
        const shopRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sellers/shop/public/${username}`)
        if (!shopRes.ok) {
          const errJson = await shopRes.json().catch(() => ({}))
          if (shopRes.status === 403 && errJson.error === 'suspended') {
            setSuspended({ reason: errJson.suspension_reason, deadline: errJson.resubmit_deadline })
            setLoading(false)
            return
          }
          setNotFound(true); setLoading(false); return
        }
        const shopJson = await shopRes.json()
        const shopData = shopJson.shop
        setShop(shopData)
        setFollowerCount(shopData.follower_count || 0)

        // Products via backend API (reduces Supabase egress)
        const productsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sellers/shop/products/${shopData.user_id}?limit=50`)
        const productsJson = await productsRes.json()
        const mappedProducts = (productsJson.products || []).map(mapDbToProduct)
        setProducts(mappedProducts.slice(0, 12))
        setAllProducts(mappedProducts)
      } catch {
        setNotFound(true)
      }
      setLoading(false)
    })()
  }, [username])

  const toggleWishlist = (e: React.MouseEvent, product: Product) => {
    e.preventDefault(); e.stopPropagation()
    try {
      const stored = JSON.parse(localStorage.getItem("wishlist") || "[]")
      const exists = stored.some((i: any) => i.id === product.id)
      const updated = exists
        ? stored.filter((i: any) => i.id !== product.id)
        : [...stored, { id: product.id, name: product.name, price: product.price, image: product.image || "", condition: product.condition || "new" }]
      localStorage.setItem("wishlist", JSON.stringify(updated))
      setWishlist(new Set(updated.map((i: any) => i.id)))
      window.dispatchEvent(new Event("wishlist-change"))
    } catch {}
  }

  const addToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault(); e.stopPropagation()
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]")
      const existing = cart.find((i: any) => i.id === product.id)
      if (existing) existing.quantity += 1
      else cart.push({ id: product.id, name: product.name, price: product.price, quantity: 1, image: product.image || "" })
      localStorage.setItem("cart", JSON.stringify(cart))
      window.dispatchEvent(new Event("cart-change"))
    } catch {}
  }

  const handleFollow = () => {
    setFollowing(f => !f)
    setFollowerCount(c => following ? c - 1 : c + 1)
  }

  if (loading) return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="animate-pulse">
        <div className="h-52 bg-gray-100 w-full" />
        <div className="max-w-7xl mx-auto px-6 mt-4 space-y-3">
          <div className="h-7 bg-gray-100 rounded w-48" />
          <div className="h-4 bg-gray-50 rounded w-32" />
        </div>
      </div>
    </div>
  )

  if (suspended) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Shop Unavailable</h1>
        <p className="text-gray-500 mb-6">This shop is currently suspended and not accepting orders.</p>
        <a href="/" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all" style={{ textDecoration: 'none' }}>
          Browse Other Shops
        </a>
      </div>
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
        <Store className="h-16 w-16 text-gray-200 mb-4" />
        <h1 className="text-xl font-bold text-gray-700">Shop not found</h1>
        <p className="text-gray-400 mt-2">@{username} doesn't exist</p>
        <a href="/search" className="mt-6 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">Browse Parts</a>
      </div>
      <Footer />
    </div>
  )

  const memberSince = shop?.created_at
    ? new Date(shop.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : ""

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex flex-col">
      <Header />

      {/* Cover */}
      <div className="h-52 w-full overflow-hidden bg-gradient-to-r from-blue-600 to-blue-400">
        {shop?.cover_url && (
          <img src={shop.cover_url} alt="cover" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Profile card */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">

          {/* Avatar row */}
          <div className="flex items-start justify-between">
            {/* Avatar — pulls up over cover */}
            <div className="w-24 h-24 rounded-full border-4 border-white bg-blue-100 overflow-hidden flex items-center justify-center shadow-lg flex-shrink-0 -mt-12">
              {shop?.logo_url
                ? <img src={shop.logo_url} alt="logo" className="w-full h-full object-cover" />
                : <Store className="h-9 w-9 text-blue-500" />
              }
            </div>
          </div>

          {/* Name + meta + follow — all in one row */}
          <div className="flex items-end justify-between mt-2">
            {/* Left: name, username, meta */}
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-xl font-bold text-gray-900">{shop?.shop_name}</h1>
                {shop?.status === "approved" && (
                  <CheckCircle className="h-5 w-5 text-blue-500 fill-blue-500" />
                )}
              </div>
              <p className="text-sm text-gray-400 mb-2">@{shop?.shop_username}</p>

              {shop?.description && (
                <p className="text-sm text-gray-600 leading-relaxed mb-2 max-w-2xl">{shop.description}</p>
              )}

              {/* Meta */}
              <div className="flex flex-col gap-y-1.5 text-sm text-gray-500">
                {/* Row 1: email, phone, since */}
                <div className="flex flex-wrap gap-x-5 gap-y-1">
                  {shop?.shop_email && (
                    <a href={`mailto:${shop.shop_email}`} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                      <Mail className="h-3.5 w-3.5" />{shop.shop_email}
                    </a>
                  )}
                  {shop?.shop_phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />{shop.shop_phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />Since {memberSince}
                  </span>
                </div>
                {/* Row 2: location */}
                {shop?.bank_city && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />{shop.bank_city}{shop.bank_country ? `, ${shop.bank_country}` : ""}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Follow button — aligned to bottom of meta row */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0 ml-6">
              <button
                onClick={handleFollow}
                className={`px-6 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
                  following
                    ? "bg-white border-gray-300 text-gray-700 hover:border-red-400 hover:text-red-500"
                    : "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {following ? "Following" : "Follow"}
              </button>
              <span className="text-xs text-gray-500">
                <span className="font-semibold text-gray-800">{followerCount.toLocaleString()}</span> followers
              </span>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-3 mb-4">
            {shop?.show_condition_badge !== false && (
              <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                shop?.product_condition === "new"
                  ? "bg-green-50 text-green-700 border-green-100"
                  : shop?.product_condition === "used"
                  ? "bg-orange-50 text-orange-700 border-orange-100"
                  : "bg-blue-50 text-blue-700 border-blue-100"
              }`}>
                {shop?.product_condition === "new" ? "New Products"
                  : shop?.product_condition === "used" ? "Used Products"
                  : "New & Used Products"}
              </span>
            )}
            {shop?.has_physical_store && (
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1">
                <Store className="h-3 w-3" /> Physical Store
              </span>
            )}
            {shop?.has_gst && (
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                <Shield className="h-3 w-3 text-emerald-500" /> GST Verified
              </span>
            )}
            {shop?.categories?.map((cat: string) => (
              <span key={cat} className="px-3 py-1 text-xs font-medium rounded-full bg-purple-50 text-purple-700 border border-purple-100 capitalize">
                {cat}
              </span>
            ))}
            {shop?.custom_tag && (
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-100 capitalize">
                {shop.custom_tag}
              </span>
            )}
          </div>

          {/* Highlights */}
          {shop?.highlights?.length > 0 && (
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
              {shop.highlights.map((h: any, i: number) => (
                <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-blue-400 shadow-sm">
                    <img src={h.image} alt={h.label} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium truncate max-w-[64px] text-center">{h.label}</span>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-8 py-8">

        {/* Tabs — equal width boxes matching search bar */}
        <div className="flex gap-0 mb-3 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <button onClick={() => setActiveTab("products")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "products" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"
            }`}>
            <Package className="h-4 w-4" />
            Products ({products.length})
          </button>
          {shop?.categories?.length > 0 && (<>
            <div className="w-px bg-gray-200" />
            <button onClick={() => setActiveTab("category")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all ${
                activeTab === "category" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"
              }`}>
              <Tag className="h-4 w-4" />
              Category
            </button>
          </>)}
          <div className="w-px bg-gray-200" />
          <button onClick={() => setActiveTab("about")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "about" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"
            }`}>
            <Info className="h-4 w-4" />
            About
          </button>

        </div>

        {/* Search bar */}
        {activeTab === "products" && (
          <div className="relative mb-6">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products in this store..."
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 shadow-sm transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {activeTab === "products" && (
          products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Package className="h-12 w-12 text-gray-200 mb-3" />
              <p className="text-gray-500 font-medium">No new releases yet</p>
            </div>
          ) : (
            <>
              {/* Filter bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">New Releases</h2>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {(() => {
                      const filtered = products
                        .filter(p => filterCategory === "all" || p.category === filterCategory)
                        .filter(p => !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand?.toLowerCase().includes(searchQuery.toLowerCase()) || p.category?.toLowerCase().includes(searchQuery.toLowerCase()))
                      return `${filtered.length} product${filtered.length !== 1 ? "s" : ""} from this shop`
                    })()}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Category pills — only shown if shop has multiple categories */}
                  {shop?.categories?.length > 1 && (
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm flex-wrap">
                      <button onClick={() => setFilterCategory("all")}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                          filterCategory === "all" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-800"
                        }`}>
                        All
                      </button>
                      {shop.categories.map((cat: string) => (
                        <button key={cat} onClick={() => setFilterCategory(cat)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize ${
                            filterCategory === cat ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-800"
                          }`}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Sort dropdown */}
                  <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as "default" | "price_asc" | "price_desc")}
                      className="text-xs font-medium text-gray-600 bg-transparent outline-none cursor-pointer"
                    >
                      <option value="default">Default Order</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                    </select>
                  </div>
                </div>
              </div>
              {/* Grid */}
              {(() => {
                const filtered = products
                  .filter(p => filterCategory === "all" || p.category === filterCategory)
                  .filter(p => !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand?.toLowerCase().includes(searchQuery.toLowerCase()) || p.category?.toLowerCase().includes(searchQuery.toLowerCase()))
                  .sort((a, b) => {
                    if (sortBy === "price_asc") return a.price - b.price
                    if (sortBy === "price_desc") return b.price - a.price
                    return 0
                  })
                return filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Package className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-gray-500 font-medium">{searchQuery ? `No results for "${searchQuery}"` : "No products in this category"}</p>
                    <button onClick={() => { setFilterCategory("all"); setSearchQuery("") }} className="mt-3 text-sm text-blue-600 hover:underline">Clear filters</button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                      {(showAllProducts ? filtered : filtered.slice(0, 12)).map(product => (
                        <a key={product.id} href={`/product/${product.id}`}
                          className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 hover:border-blue-100 transition-all duration-200">
                          <div className="relative aspect-square bg-gray-50 overflow-hidden">
                            {product.image
                              ? <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              : <div className="w-full h-full flex items-center justify-center"><Package className="h-8 w-8 text-gray-200" /></div>
                            }
                            <button onClick={(e) => toggleWishlist(e, product)}
                              className={`absolute top-1.5 right-1.5 w-7 h-7 rounded-lg flex items-center justify-center backdrop-blur-sm transition-all shadow-sm ${
                                wishlist.has(product.id) ? "bg-white" : "bg-white/80 hover:bg-white"
                              }`}>
                              <Heart className={`h-3.5 w-3.5 ${product.condition === "new" ? (wishlist.has(product.id) ? "fill-blue-500 text-blue-500" : "text-blue-400") : (wishlist.has(product.id) ? "fill-orange-500 text-orange-500" : "text-orange-300")}`} />
                            </button>
                          </div>
                          <div className="p-2.5">
                            <p className="text-[11px] font-semibold text-gray-800 truncate mb-1">{product.name}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-gray-900">₹{product.price?.toLocaleString("en-IN")}</span>
                              {product.originalPrice > product.price && (
                                <span className="text-[10px] text-gray-300 line-through">₹{product.originalPrice?.toLocaleString("en-IN")}</span>
                              )}
                            </div>
                            <button onClick={(e) => addToCart(e, product)}
                              className="mt-2 w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1">
                              <ShoppingCart className="h-3 w-3" /> Add to Cart
                            </button>
                          </div>
                        </a>
                      ))}
                    </div>
                    {filtered.length > 12 && (
                      <button
                        onClick={() => setShowAllProducts(v => !v)}
                        className="mt-4 w-full py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
                      >
                        {showAllProducts ? "Show less" : `View all ${filtered.length} products`}
                      </button>
                    )}
                  </>
                )
              })()}

              {/* Popular Products — lowest stock first (proxy for most purchased), fallback to newest */}
              {(() => {
                const allPopular = [...allProducts]
                  .sort((a, b) => {
                    const aStock = a.stock ?? 9999
                    const bStock = b.stock ?? 9999
                    if (aStock !== bStock) return aStock - bStock
                    const aDisc = a.originalPrice > a.price ? (a.originalPrice - a.price) / a.originalPrice : 0
                    const bDisc = b.originalPrice > b.price ? (b.originalPrice - b.price) / b.originalPrice : 0
                    return bDisc - aDisc
                  })
                const popular = showAllPopular ? allPopular : allPopular.slice(0, 12)
                if (allPopular.length === 0) return null
                return (
                  <div className="mt-10">
                    <div className="flex items-center gap-3 mb-5">
                      <h2 className="text-lg font-bold text-gray-900">Popular Products</h2>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full">Trending</span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                      {popular.map(product => (
                        <a key={product.id} href={`/product/${product.id}`}
                          className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 hover:border-blue-100 transition-all duration-200">
                          <div className="relative aspect-square bg-gray-50 overflow-hidden">
                            {product.image
                              ? <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              : <div className="w-full h-full flex items-center justify-center"><Package className="h-8 w-8 text-gray-200" /></div>
                            }
                            <button onClick={(e) => toggleWishlist(e, product)}
                              className={`absolute top-1.5 right-1.5 w-7 h-7 rounded-lg flex items-center justify-center backdrop-blur-sm transition-all shadow-sm ${
                                wishlist.has(product.id) ? "bg-white" : "bg-white/80 hover:bg-white"
                              }`}>
                              <Heart className={`h-3.5 w-3.5 ${product.condition === "new" ? (wishlist.has(product.id) ? "fill-blue-500 text-blue-500" : "text-blue-400") : (wishlist.has(product.id) ? "fill-orange-500 text-orange-500" : "text-orange-300")}`} />
                            </button>
                          </div>
                          <div className="p-2.5">
                            <p className="text-[11px] font-semibold text-gray-800 truncate mb-1">{product.name}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-gray-900">₹{product.price?.toLocaleString("en-IN")}</span>
                              {product.originalPrice > product.price && (
                                <span className="text-[10px] text-gray-300 line-through">₹{product.originalPrice?.toLocaleString("en-IN")}</span>
                              )}
                            </div>
                            <button onClick={(e) => addToCart(e, product)}
                              className="mt-2 w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1">
                              <ShoppingCart className="h-3 w-3" /> Add to Cart
                            </button>
                          </div>
                        </a>
                      ))}
                    </div>
                    {allPopular.length > 12 && (
                      <button
                        onClick={() => setShowAllPopular(v => !v)}
                        className="mt-4 w-full py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
                      >
                        {showAllPopular ? "Show less" : `View all ${allPopular.length} products`}
                      </button>
                    )}
                  </div>
                )
              })()}
            </>
          )
        )}

        {activeTab === "category" && (
          <div className="space-y-8">
            {/* Category search bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={categorySearch}
                onChange={e => setCategorySearch(e.target.value)}
                placeholder="Search within categories..."
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 shadow-sm transition-all"
              />
              {categorySearch && (
                <button onClick={() => setCategorySearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Idle state — no text typed yet */}
            {!categorySearch && allProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Package className="h-12 w-12 text-gray-200 mb-3" />
                <p className="text-gray-700 font-semibold">No products listed yet</p>
                <p className="text-sm text-gray-400 mt-1">This shop hasn't added any products yet.</p>
              </div>
            )}

            {!categorySearch && allProducts.length > 0 && (
              <div className="flex items-center gap-2 px-1 mb-2">
                <Search className="h-3.5 w-3.5 text-gray-300" />
                <p className="text-sm text-gray-400">Type to search across all categories</p>
              </div>
            )}

            {(() => {
              const uniqueCats = [...new Set(allProducts.map(p => p.category).filter(Boolean))] as string[]
              return uniqueCats.length > 0 ? (
                uniqueCats.map((cat: string) => {
                  const catProducts = allProducts.filter(p => {
                    const matchesCat = p.category === cat
                    const matchesSearch = !categorySearch ||
                      p.name?.toLowerCase().includes(categorySearch.toLowerCase()) ||
                      p.brand?.toLowerCase().includes(categorySearch.toLowerCase())
                    return matchesCat && matchesSearch
                  })
                  if (catProducts.length === 0) return null
                  const isExpanded = expandedCategories.has(cat)
                  // 6 per row — show only first row (6 items) unless expanded
                  const visibleProducts = isExpanded ? catProducts : catProducts.slice(0, 6)
                  return (
                    <div key={cat}>
                      {/* Category header */}
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-base font-bold text-gray-900 capitalize">{cat}</h3>
                        <span className="text-xs text-gray-400 font-medium">{catProducts.length} product{catProducts.length !== 1 ? "s" : ""}</span>
                        <div className="flex-1 h-px bg-gray-100" />
                      </div>
                      {/* Product grid — strictly 6 per row, 1 row by default */}
                      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                        {visibleProducts.map(product => (
                          <a key={product.id} href={`/product/${product.id}`}
                            className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 hover:border-blue-100 transition-all duration-200">
                            <div className="relative aspect-square bg-gray-50 overflow-hidden">
                              {product.image
                                ? <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                : <div className="w-full h-full flex items-center justify-center"><Package className="h-7 w-7 text-gray-200" /></div>
                              }
                              <button onClick={(e) => toggleWishlist(e, product)}
                                className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-lg flex items-center justify-center backdrop-blur-sm transition-all shadow-sm ${
                                  wishlist.has(product.id) ? "bg-white" : "bg-white/80 hover:bg-white"
                                }`}>
                                <Heart className={`h-3 w-3 ${product.condition === "new" ? (wishlist.has(product.id) ? "fill-blue-500 text-blue-500" : "text-blue-400") : (wishlist.has(product.id) ? "fill-orange-500 text-orange-500" : "text-orange-300")}`} />
                              </button>
                            </div>
                            <div className="p-2">
                              <p className="text-[11px] font-semibold text-gray-800 truncate mb-0.5">{product.name}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-900">₹{product.price?.toLocaleString("en-IN")}</span>
                                {product.originalPrice > product.price && (
                                  <span className="text-[10px] text-gray-300 line-through">₹{product.originalPrice?.toLocaleString("en-IN")}</span>
                                )}
                              </div>
                              <button onClick={(e) => addToCart(e, product)}
                                className="mt-1.5 w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1">
                                <ShoppingCart className="h-3 w-3" /> Add to Cart
                              </button>
                            </div>
                          </a>
                        ))}
                      </div>
                      {/* View all / Show less button — below the row */}
                      {catProducts.length > 6 && (
                        <button
                          onClick={() => {
                            const next = new Set(expandedCategories)
                            isExpanded ? next.delete(cat) : next.add(cat)
                            setExpandedCategories(next)
                          }}
                          className="mt-3 w-full py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
                        >
                          {isExpanded ? "Show less" : `View all ${catProducts.length} products in ${cat}`}
                        </button>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Search className="h-10 w-10 text-gray-200 mb-3" />
                  <p className="text-gray-700 font-semibold">No results found</p>
                  <p className="text-sm text-gray-400 mt-1">No products match <span className="font-medium text-gray-600">"{categorySearch}"</span> in any category</p>
                  <button onClick={() => setCategorySearch("")} className="mt-4 px-4 py-2 text-xs font-semibold text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors">Clear search</button>
                </div>
              )
            })()}
          </div>
        )}

        {activeTab === "about" && (
          <div className="w-full">
            {(() => {
              const blocks = (() => {
                try {
                  return typeof shop?.about_blocks === "string"
                    ? JSON.parse(shop.about_blocks)
                    : shop?.about_blocks || []
                } catch { return [] }
              })()
              const htmlContent = blocks[0]?.type === "html" ? blocks[0].content : null
              if (!htmlContent) return (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <Package className="h-12 w-12 text-gray-200 mb-3" />
                  <p className="text-gray-700 font-semibold">Nothing here yet</p>
                  <p className="text-sm text-gray-400 mt-1">This shop hasn't added an about page yet.</p>
                </div>
              )
              return (
                <div
                  className="prose prose-sm max-w-none text-gray-700
                    [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mb-3 [&_h2]:mt-6
                    [&_p]:mb-4 [&_p]:leading-relaxed [&_p]:text-gray-700
                    [&_strong]:font-bold [&_em]:italic
                    [&_figure]:my-6 [&_figure]:mx-0
                    [&_img]:w-full [&_img]:h-64 [&_img]:object-cover [&_img]:shadow-sm [&_img]:rounded-2xl
"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              )
            })()}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}