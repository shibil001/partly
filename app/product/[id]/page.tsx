"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Heart,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Package,
  Star,
  Minus,
  Plus,
  ArrowLeft,
  MessageCircle,
  SlidersHorizontal,
  Zap,
  Shield,
  MapPin,
  Check,
  Store,
  ExternalLink,
  X,
  Ruler,
  Mail,
} from "lucide-react"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { LoginModal } from "@/components/login-modal"
import { supabase, mapDbToProduct } from "@/lib/supabase"

type Product = ReturnType<typeof mapDbToProduct>

/* ── Star Rating ── */
function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={
            i < Math.floor(rating)
              ? "fill-blue-500 text-blue-500"
              : i < rating
              ? "fill-blue-200 text-blue-500"
              : "fill-gray-200 text-gray-200"
          }
        />
      ))}
    </div>
  )
}

/* ── Collapsible Accordion ── */
function Accordion({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-6 text-left"
      >
        <h2 className="text-lg md:text-xl font-bold text-gray-900 uppercase tracking-wide">
          {title}
        </h2>
        {open ? (
          <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {open && <div className="pb-8">{children}</div>}
    </div>
  )
}

/* ════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════ */
export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [shopSuspended, setShopSuspended] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [qty, setQty] = useState(1)
  const [wishlisted, setWishlisted] = useState(false)
  const [shop, setShop] = useState<any>(null)

  // Load wishlist state for this product on mount
  useEffect(() => {
    if (!productId) return
    try {
      const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]")
      setWishlisted(wishlist.some((i: any) => i.id === productId))
    } catch {}
  }, [productId])

  const toggleWishlist = () => {
    if (!product) return
    try {
      const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]")
      const exists = wishlist.some((i: any) => i.id === product.id)
      let updated
      if (exists) {
        updated = wishlist.filter((i: any) => i.id !== product.id)
        setWishlisted(false)
      } else {
        updated = [...wishlist, { id: product.id, name: product.name, price: product.price, image: product.image || "", condition: product.condition || "new" }]
        setWishlisted(true)
      }
      localStorage.setItem("wishlist", JSON.stringify(updated))
      window.dispatchEvent(new Event("wishlist-change"))
      try {
        const token = localStorage.getItem("token")
        if (token) fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wishlist`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ items: updated }),
        })
      } catch {}
    } catch {}
  }
  const [recentProducts, setRecentProducts] = useState<Product[]>([])
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [selectedSize, setSelectedSize] = useState("")
  const [sizeChartOpen, setSizeChartOpen] = useState(false)
  const [cartAdded, setCartAdded] = useState(false)
  const [isInCart, setIsInCart] = useState(false)
  const [sizeError, setSizeError] = useState(false)
  const [offerOpen, setOfferOpen] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [productSellerId, setProductSellerId] = useState<string | null>(null)
  const [existingOffer, setExistingOffer] = useState<{amount: number, note: string, status?: string} | null>(null)
  const [msgOpen, setMsgOpen] = useState(false)
  const [msgText, setMsgText] = useState("")
  const [msgSending, setMsgSending] = useState(false)
  const [msgSent, setMsgSent] = useState(false)
  const [offerAmount, setOfferAmount] = useState("")
  const [offerNote, setOfferNote] = useState("")
  const [offerSending, setOfferSending] = useState(false)
  const [offerSent, setOfferSent] = useState(false)

  // Fetch related products
  useEffect(() => {
    if (!product) return
    const fetchRelated = async () => {
      try {
        const params = new URLSearchParams()
        if (product.category) params.set('category', product.category)
        else if (product.brand) params.set('brand', product.brand)
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${product.id}/related?${params.toString()}`)
        const json = await res.json()
        if (json.products?.length > 0) {
          setRelatedProducts(json.products.map(mapDbToProduct))
        } else if (product.brand) {
          const res2 = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${product.id}/related?brand=${encodeURIComponent(product.brand)}`)
          const json2 = await res2.json()
          if (json2.products) setRelatedProducts(json2.products.map(mapDbToProduct))
        }
      } catch {}
    }
    fetchRelated()
  }, [product?.id])

  // Check if already in cart
  useEffect(() => {
    if (!product) return
    const checkCart = () => {
      try {
        const stored = localStorage.getItem("cart")
        const cart = stored ? JSON.parse(stored) : []
        const isUsed = shop?.product_condition === 'used'
        const found = !isUsed && cart.some((i: any) => i.id === product.id)
        setIsInCart(found)
      } catch {}
    }
    checkCart()
    window.addEventListener("cart-change", checkCart)
    return () => window.removeEventListener("cart-change", checkCart)
  }, [product])

  const addToCart = () => {
    if (!product) return
    if (isInCart && !isUsedProduct) { window.dispatchEvent(new Event("open-cart")); return }
    // Check if product has selectable size options (format: "S:10,M:5,L:3")
    const sizeEntries = product.size
      ? product.size.split(",").map((s: string) => {
          const parts = s.trim().split(":")
          return { name: parts[0]?.trim(), stock: parseInt(parts[1]?.trim()) || 0 }
        }).filter((s: any) => s.name && s.stock > 0)
      : []
    const hasSizes = sizeEntries.length > 0
    if (hasSizes && !selectedSize) {
      setSizeError(true)
      setTimeout(() => setSizeError(false), 3000)
      return
    }
    try {
      const stored = localStorage.getItem("cart")
      const cart = stored ? JSON.parse(stored) : []
      // Match by id + size so same product in different sizes = different cart entries
      const existing = cart.find((i: any) => i.id === product.id && i.size === (selectedSize || null))
      if (existing) {
        existing.quantity += qty
      } else {
        cart.push({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: qty,
          image: product.image || "",
          size: selectedSize || null,
        })
      }
      localStorage.setItem("cart", JSON.stringify(cart))
      window.dispatchEvent(new Event("cart-change"))
      setCartAdded(true)
      setIsInCart(true)
      setTimeout(() => setCartAdded(false), 1500)
    } catch {}
  }


  useEffect(() => {
    if (!productId) return
    ;(async () => {
      setLoading(true)
      const prodRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${productId}`)
      const prodJson = await prodRes.json()
      const data = prodJson.product
      if (!data) setError("Product not found")
      else {
        const p = mapDbToProduct(data)
        setProduct(p)
        setProductSellerId(data.seller_id || null)
        // Check if buyer already made an offer on this product
        try {
          const token = localStorage.getItem("token")
          if (token && data.id) {
            const msgRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/my-offer/${data.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            if (msgRes.ok) {
              const msgData = await msgRes.json()
              if (msgData.offer) setExistingOffer({ amount: msgData.offer.offer_amount, note: msgData.offer.note || "", status: msgData.offer.status })
            }
          }
        } catch {}
        // Track recently viewed via API (only if logged in)
        try {
          const token = localStorage.getItem("token")
          if (token) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/activity/viewed`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ product_id: p.id })
            })
          }
        } catch {}
        // Fetch shop via backend to bypass RLS
        if (data.seller_id) {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sellers/shop/by-seller/${data.seller_id}`)
            if (res.status === 403) {
              setShopSuspended(true)
            } else {
              const shopData = await res.json()
              if (shopData?.shop) {
                const s = shopData.shop
                s.show_category_tag = s.show_category_tag === true || s.show_category_tag === "true"
                setShop(s)
              }
            }
          } catch {}
        }
      }
      setLoading(false)
    })()
  }, [productId])

  useEffect(() => {
    if (!productId) return
    ;(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`)
        const json = await res.json()
        const all = (json.products || []).filter((p: any) => p.id !== productId).slice(0, 4)
        setRecentProducts(all.map(mapDbToProduct))
      } catch {}
    })()
  }, [productId])

  const images = product ? [product.image, ...(product.images || [])].filter(Boolean) : []

  const prevImage = useCallback(() => {
    setSelectedImage((i) => (i === 0 ? images.length - 1 : i - 1))
  }, [images.length])

  const nextImage = useCallback(() => {
    setSelectedImage((i) => (i === images.length - 1 ? 0 : i + 1))
  }, [images.length])

  /* ── Use shared Header ── */
  const ProductHeader = <Header />

  /* ── Shop Suspended ── */
  if (shopSuspended) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Unavailable</h1>
          <p className="text-gray-500 mb-6">This product is from a shop that is currently suspended and not accepting orders.</p>
          <a href="/" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all" style={{ textDecoration: 'none' }}>
            Browse Other Products
          </a>
        </div>
      </div>
    )
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {ProductHeader}
        <div className="max-w-7xl mx-auto px-4 py-10 animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl animate-pulse" />
            <div className="space-y-4 pt-4">
              <div className="h-5 w-36 bg-gray-200 rounded" />
              <div className="h-4 w-48 bg-gray-100 rounded" />
              <div className="h-8 w-3/4 bg-gray-200 rounded" />
              <div className="h-5 w-24 bg-gray-200 rounded mt-2" />
              <div className="h-8 w-52 bg-gray-200 rounded mt-4" />
              <div className="h-14 w-full bg-gray-200 rounded-lg mt-6" />
              <div className="h-14 w-full bg-gray-100 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── Error ── */
  if (error || !product) {
    return (
      <div className="min-h-screen bg-white">
        {ProductHeader}
        <div className="max-w-7xl mx-auto px-4 py-24 text-center">
          <Package className="h-16 w-16 text-gray-200 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product not found</h1>
          <p className="text-gray-500 mb-8">This product doesn&apos;t exist or has been removed.</p>
          <Button onClick={() => window.history.back()} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Go Back
          </Button>
        </div>
      </div>
    )
  }

  /* ── Derived ── */
  const discount = product.discountPercent || (product.originalPrice && product.price ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0)
  const vehicle = [product.vehicle_make, product.vehicle_model, product.vehicle_year].filter(Boolean).join(" ")
  const stock: "in" | "low" | "out" = product.stock === 0 ? "out" : product.stock <= (product.minStock || 3) ? "low" : "in"

  const toList = (val: unknown): string[] => {
    if (Array.isArray(val)) return val.filter(Boolean)
    if (typeof val === "string" && val.trim()) return val.split(",").map((s: string) => s.trim()).filter(Boolean)
    return []
  }

  const features = toList(product.features)
  const includes = toList(product.includes)

  // Custom fields from seller — [{label, value}]
  const customFields: { label: string; value: string }[] =
    ((product as any).customFields || (product as any).custom_fields || [])
      .filter((f: any) => f?.label && f?.value)

  const isUsedProduct = shop?.product_condition === "used"
  const specRows = isUsedProduct ? [
    { label: "Vehicle Model", value: (product as any).vehicleModel, pdfUrl: null },
    { label: "Year", value: (product as any).year, pdfUrl: null },
    { label: "Condition", value: product.condition && !["new","used"].includes(product.condition) ? product.condition : null, pdfUrl: null },
    { label: "Part Number", value: (product as any).partNumber, pdfUrl: null },
    { label: "Color", value: product.colour, pdfUrl: null },
    { label: "Fitment", value: product.fitment || vehicle || null, pdfUrl: null },
    ...customFields.map(f => ({ label: f.label, value: f.value, pdfUrl: null })),
  ].filter(row => row.value) : [
    { label: "Material", value: product.material },
    { label: "Colour", value: product.colour },
    { label: "Product weight", value: product.weight ? `${product.weight} ${product.weightUnit || "kg"}` : null },
    { label: "Product measurement L*B*H (cm)", value: product.measurements },
    { label: "Fitment", value: product.fitment || vehicle || null },
    { label: "Warranty", value: product.warranty, pdfUrl: product.warrantyTerms?.startsWith("data:application/pdf") ? product.warrantyTerms : null },
    { label: "Includes", value: includes.length ? includes.join(", ") : null },
    ...customFields.map(f => ({ label: f.label, value: f.value, pdfUrl: null })),
  ].filter(row => row.value)

  const reviews = [
    { id: 1, name: "Gaurav Sharma", date: "02/13/2026", rating: 5, title: product.name, body: "This product feels premium and well-made. Fit and finish are top notch, and the materials look durable." },
    { id: 2, name: "Mohit Sharma", date: "02/13/2026", rating: 4, title: product.name, body: "Good quality product. Works as expected. Shipping was fast and packaging was secure." },
    { id: 3, name: "Dhruv Kumar", date: "02/10/2026", rating: 5, title: product.name, body: "Installed this and the improvement was instantly noticeable. Build quality is solid and feels responsive." },
  ]
  const avgRating = 4.5
  const totalReviews = 10
  const ratingBars = [
    { stars: 5, count: 5 },
    { stars: 4, count: 5 },
    { stars: 3, count: 0 },
    { stars: 2, count: 0 },
    { stars: 1, count: 0 },
  ]

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {ProductHeader}

      <main className="flex-1">
        {/* TOP — Image + Info */}
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
            {/* IMAGE */}
            <div>
              <div className="relative aspect-square rounded-xl overflow-hidden group border border-gray-100 bg-white">
                {images.length > 0 ? (
                  <img src={images[selectedImage]} alt={product.name} className="w-full h-full object-contain p-6 mix-blend-multiply" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Package className="h-24 w-24 text-gray-200" /></div>
                )}
                <button onClick={toggleWishlist} className={`absolute bottom-4 left-4 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all bg-white`}>
                  <Heart className={`h-5 w-5 transition-colors ${wishlisted ? ((((product)?.partType === "used") || ["used", "Used - Like New", "Used - Good", "Used - Fair", "Refurbished"].includes((product)?.condition as string)) ? "fill-orange-500 text-orange-500" : "fill-blue-500 text-blue-500") : ((((product)?.partType === "used") || ["used", "Used - Like New", "Used - Good", "Used - Fair", "Refurbished"].includes((product)?.condition as string)) ? "text-orange-400" : "text-blue-400")}`} />
                </button>
                {images.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft className="h-4 w-4 text-gray-600" /></button>
                    <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight className="h-4 w-4 text-gray-600" /></button>
                  </>
                )}
                {images.length > 1 && (
                  <span className="absolute bottom-4 right-4 bg-white/90 border border-gray-200 text-gray-600 text-sm font-medium px-3 py-1 rounded-full">{selectedImage + 1} / {images.length}</span>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
                  {images.map((src, i) => (
                    <button key={i} onClick={() => setSelectedImage(i)} className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${i === selectedImage ? "border-blue-600 ring-2 ring-blue-100" : "border-gray-200 hover:border-gray-300"}`}>
                      <img src={src} alt="" className="w-full h-full object-contain p-1 mix-blend-multiply" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* INFO */}
            <div className="flex flex-col">
              <div className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm px-4 py-1.5 rounded-full self-start mb-5">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span><strong className="text-green-400">{Math.floor(Math.random() * 40 + 10)}</strong> Riders viewing this right now</span>
              </div>

              <p className="text-sm text-gray-500 mb-1">{[product.brand, product.sku ? `SKU: ${product.sku}` : ""].filter(Boolean).join("  |  ")}</p>

              <h1 className="text-lg md:text-xl font-bold text-gray-900 uppercase tracking-tight leading-snug">{product.name?.length > 180 ? product.name.slice(0, 180) + "…" : product.name}</h1>

              {(product.freeShipping || discount > 0 || product.flairTag) && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {product.freeShipping && <span className="px-2 py-0.5 bg-green-600 text-white text-[9px] font-bold rounded-sm uppercase">Free Shipping</span>}
                  {discount > 0 && <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-[9px] font-bold rounded-sm uppercase">{discount}% Off</span>}
                  {product.flairTag && <span className="px-2 py-0.5 bg-gray-900 text-white text-[9px] font-bold rounded-sm uppercase">{product.flairTag}</span>}
                </div>
              )}

              <div className="flex items-baseline gap-3 mt-4">
                <span className="text-3xl font-bold text-gray-900">₹{product.price?.toLocaleString("en-IN")}</span>
                {product.originalPrice > product.price && <span className="text-lg text-gray-400 line-through">₹{product.originalPrice?.toLocaleString("en-IN")}</span>}
              </div>

              {(product.fastShipping || product.warranty || vehicle) && (
                <div className="mt-5 space-y-2">
                  {product.fastShipping && <div className="flex items-center gap-2 text-sm text-gray-600"><Zap className="h-4 w-4 text-blue-600" /> Express Delivery Available</div>}
                  {product.warranty && <div className="flex items-center gap-2 text-sm text-gray-600"><Shield className="h-4 w-4 text-blue-600" /> {product.warranty} Warranty</div>}
                  {vehicle && <div className="flex items-center gap-2 text-sm text-gray-600"><Check className="h-4 w-4 text-blue-600" /> Fits: {vehicle}</div>}
                </div>
              )}

              {/* Size Selector — only shown if product has sizes */}
              {product.size && (() => {
                const sizeEntries = product.size.split(",").map((s: string) => {
                  const parts = s.trim().split(":")
                  return { name: parts[0]?.trim(), stock: parseInt(parts[1]?.trim()) || 0 }
                }).filter((s: any) => s.name)
                return sizeEntries.length > 0 ? (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Select Size</span>
                      </div>
                      {product.sizeChart && (
                        <button
                          onClick={() => setSizeChartOpen(true)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors underline underline-offset-2"
                        >
                          View Size Chart
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sizeEntries.map((size: any) => (
                        <button
                          key={size.name}
                          onClick={() => { setSelectedSize(size.name); setSizeError(false) }}
                          disabled={size.stock === 0}
                          className={`px-4 py-2 text-sm font-medium rounded-xl border transition-all ${
                            size.stock === 0
                              ? "border-gray-100 text-gray-300 cursor-not-allowed line-through bg-gray-50"
                              : selectedSize === size.name
                              ? "border-blue-600 bg-blue-50 text-blue-600"
                              : sizeError
                              ? "border-red-300 text-gray-600 hover:border-red-400 hover:bg-red-50"
                              : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {size.name}
                          {size.stock > 0 && size.stock <= 5 && (
                            <span className="ml-1.5 text-[10px] text-yellow-600">({size.stock} left)</span>
                          )}
                        </button>
                      ))}
                    </div>
                    {sizeError && (
                      <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                        <span>⚠</span> Please select a size before adding to cart
                      </p>
                    )}
                  </div>
                ) : null
              })()}

              {/* Size Chart Popup */}
              {sizeChartOpen && product.sizeChart && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center" onClick={() => setSizeChartOpen(false)}>
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                  <div className="relative bg-white rounded-2xl shadow-2xl max-w-xs w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <h3 className="text-xs font-semibold text-gray-900">Size Chart</h3>
                      <button onClick={() => setSizeChartOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="p-3">
                      <img src={product.sizeChart} alt="Size Chart" className="w-full h-auto rounded-lg" />
                    </div>
                  </div>
                </div>
              )}

              {((product as any).partType === "used" || ["used","Used - Like New","Used - Good","Used - Fair","Refurbished"].includes(product.condition)) ? (
                /* Used product — Make an Offer + Message + Buy It Now */
                <div className="mt-8 flex flex-col gap-3">
                  {((product as any).allowMakeOffer !== false || (product as any).allowMessage !== false) && (
                    <div className="flex gap-3">
                      {(product as any).allowMakeOffer !== false && (
                        existingOffer ? (
                          existingOffer.status === "accepted" ? (
                            <div className="flex-1 h-11 flex items-center justify-center gap-1.5 bg-green-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl">
                              ✓ Offer Accepted · ₹{existingOffer.amount.toLocaleString("en-IN")}
                            </div>
                          ) : (product as any).has_accepted_offer && (product?.stock || 0) <= 1 ? (
                            <div className="flex-1 h-11 flex items-center justify-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold uppercase tracking-wider rounded-xl">
                              Negotiation in Progress
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setOfferAmount(String(existingOffer.amount))
                                setOfferNote(existingOffer.note)
                                setOfferSent(false)
                                setOfferOpen(true)
                              }}
                              className="flex-1 h-11 flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
                            >
                              {existingOffer.status === "declined" ? "✗ Offer Declined — Edit" : "Edit Your Offer · ₹" + existingOffer.amount.toLocaleString("en-IN")}
                            </button>
                          )
                        ) : (product as any).has_accepted_offer && (product?.stock || 0) <= 1 ? (
                          <div className="flex-1 h-11 flex items-center justify-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold uppercase tracking-wider rounded-xl">
                            Negotiation in Progress
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              const token = localStorage.getItem("token")
                              if (!token) { setShowLoginModal(true); return }
                              setOfferOpen(true); setOfferSent(false); setOfferAmount(""); setOfferNote("")
                            }}
                            className="flex-1 h-11 flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
                          >
                            Make an Offer
                          </button>
                        )
                      )}
                      {(product as any).allowMessage !== false && (
                        <button
                          onClick={() => {
                            const token = localStorage.getItem("token")
                            if (!token) { setShowLoginModal(true); return }
                            setMsgOpen(true); setMsgSent(false); setMsgText("")
                          }}
                          className={`h-11 flex items-center justify-center rounded-xl transition-colors ${(product as any).allowMakeOffer === false ? "flex-1 bg-gray-900 hover:bg-gray-800 text-white" : "px-4 whitespace-nowrap border-2 border-gray-900 text-gray-900 hover:bg-gray-50"}`}
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                  <button
                    disabled={stock === "out" || !!(product as any).has_accepted_offer && (product?.stock || 0) <= 1}
                    onClick={() => {
                      if (!product) return
                      try {
                        sessionStorage.setItem("buy_now_item", JSON.stringify({
                          id: product.id, name: product.name, price: product.price,
                          image: product.image, size: null, quantity: 1
                        }))
                      } catch {}
                      window.location.href = "/checkout?mode=buynow"
                    }}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors disabled:opacity-40"
                  >
                    {stock === "out" ? "Out of Stock" : "Buy It Now"}
                  </button>
                </div>
              ) : (
                /* New product — Add to Cart + Buy It Now */
                <>
                  <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    {(product.stock > 1) && (
                      <div className="flex items-center border border-gray-900 rounded-xl overflow-hidden">
                        <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-11 h-11 flex items-center justify-center hover:bg-gray-100 transition-colors" disabled={stock === "out"}><Minus className="h-3.5 w-3.5" /></button>
                        <span className="w-11 h-11 flex items-center justify-center text-sm font-medium border-x border-gray-900">{qty}</span>
                        <button onClick={() => setQty(Math.min(product.stock || 99, qty + 1))} className="w-11 h-11 flex items-center justify-center hover:bg-gray-100 transition-colors" disabled={stock === "out"}><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                    )}
                    <button disabled={stock === "out"} onClick={addToCart} className={`flex-1 h-11 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors disabled:opacity-40 ${sizeError ? "bg-red-500 hover:bg-red-600" : "bg-gray-900 hover:bg-gray-800"}`}>
                      {stock === "out" ? "Out of Stock" : cartAdded ? "✓ Added!" : (isInCart && !isUsedProduct) ? "Go to Cart" : sizeError ? "Select a Size First" : "Add to Cart"}
                    </button>
                  </div>
                  <button
                    disabled={stock === "out" || !!(product as any).has_accepted_offer && (product?.stock || 0) <= 1}
                    onClick={() => {
                    if (!product) return
                    // Validate size selection if product has sizes
                    const sizeEntries = product.size
                      ? product.size.split(",").map((s: string) => {
                          const parts = s.trim().split(":")
                          return { name: parts[0]?.trim(), stock: parseInt(parts[1]?.trim()) || 0 }
                        }).filter((s: any) => s.name && s.stock > 0)
                      : []
                    if (sizeEntries.length > 0 && !selectedSize) {
                      setSizeError(true)
                      setTimeout(() => setSizeError(false), 3000)
                      return
                    }
                    try {
                      const buyNowItem = { id: product.id, name: product.name, price: product.price, image: product.image, size: selectedSize || null, quantity: qty }
                      sessionStorage.setItem("buy_now_item", JSON.stringify(buyNowItem))
                    } catch {}
                    window.location.href = "/checkout?mode=buynow"
                  }}
                  className="mt-3 w-full h-11 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40">
                    Buy It Now
                  </button>
                </>
              )}

              {/* Seller Shop Profile */}
              <div className="mt-6 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {shop?.logo_url
                      ? <img src={shop.logo_url} alt="shop" className="w-full h-full object-cover" />
                      : <Store className="h-6 w-6 text-blue-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {shop?.shop_name || "Partly Seller"}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {shop?.has_physical_store && shop?.show_physical_tag !== false && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                          <Store className="h-3 w-3" /> Physical Shop
                        </span>
                      )}
                      {shop?.show_category_tag === true && shop?.categories?.[0] && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">
                          <Star className="h-3 w-3" /> {shop.categories[0]}
                        </span>
                      )}
                      {shop?.custom_tag && shop?.show_custom_tag !== false && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-full">
                          <Star className="h-3 w-3" /> {shop.custom_tag}
                        </span>
                      )}
                    </div>
                  </div>
                  {shop?.shop_username && (
                    <a href={`/shop/${shop.shop_username}`} className="flex items-center gap-1 px-4 py-2 text-xs font-medium text-blue-600 border border-blue-200 rounded-full hover:bg-blue-50 transition-colors flex-shrink-0">
                      Visit Shop <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Share on WhatsApp */}
              <button
                onClick={() => {
                  const msg = `Check out ${product.name} on Partly! ${window.location.href}`
                  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank")
                }}
                className="mt-3 flex items-center justify-center gap-2 text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Share it on WhatsApp
              </button>

              {stock !== "in" && (
                <div className="mt-4 flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${stock === "low" ? "bg-yellow-500" : "bg-red-500"}`} />
                  <span className={`text-sm font-medium ${stock === "low" ? "text-yellow-600" : "text-red-600"}`}>
                    {stock === "low" ? `Only ${product.stock} left in stock` : "Currently out of stock"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* MIDDLE — Description · Specs · Features */}
        <section className="max-w-7xl mx-auto px-4 mt-4">
          <Accordion title="Description" defaultOpen>
            {product.description ? <p className="text-gray-700 leading-relaxed whitespace-pre-line">{product.description}</p> : <p className="text-gray-400 italic">No description available for this product.</p>}
          </Accordion>

          {specRows.length > 0 && (
            <Accordion title="Specifications">
              {specRows.map((row, i) => (
                <div key={i} className="flex items-center justify-between py-4 border-b border-dotted border-gray-200 last:border-b-0">
                  <span className="text-sm font-semibold text-gray-900">{row.label}</span>
                  {row.pdfUrl ? (
                    <a
                      href={row.pdfUrl}
                      download="warranty-terms.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 underline underline-offset-2 hover:text-blue-800 transition-colors text-right"
                    >
                      {row.value}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-600 text-right">{row.value}</span>
                  )}
                </div>
              ))}
            </Accordion>
          )}

          <Accordion title={isUsedProduct ? "Additional Details" : "Features"}>
            {product.features ? (
              <div
                className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.features }}
              />
            ) : (
              <p className="text-gray-400 italic">No {isUsedProduct ? "additional details" : "features"} listed for this product.</p>
            )}
          </Accordion>
        </section>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 mt-12">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {relatedProducts.map((item) => {
                const itemImages = [item.image, ...(item.images || [])].filter(Boolean)
                const itemDiscount = item.discountPercent || (item.originalPrice && item.price ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100) : 0)
                return (
                  <a key={item.id} href={`/product/${item.id}`} className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all">
                    <div className="relative aspect-square overflow-hidden bg-white">
                      {itemImages.length > 0
                        ? <img src={itemImages[0]} alt={item.name} className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300 mix-blend-multiply" />
                        : <div className="w-full h-full flex items-center justify-center"><Package className="h-10 w-10 text-gray-200" /></div>}
                      {itemDiscount > 0 && <span className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">{itemDiscount}% OFF</span>}
                    </div>
                    <div className="p-3">
                      <p className="text-[10px] text-gray-400 mb-0.5">{item.brand}</p>
                      <h3 className="text-xs font-medium text-gray-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">{item.name}</h3>
                      <span className="text-sm font-bold text-gray-900 mt-1.5 block">₹{item.price?.toLocaleString("en-IN")}</span>
                    </div>
                  </a>
                )
              })}
            </div>
          </section>
        )}

        {/* RECENTLY VIEWED */}
        <section className="max-w-7xl mx-auto px-4 mt-12">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Recently Viewed</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recentProducts.map((item) => {
              const itemImages = [item.image, ...(item.images || [])].filter(Boolean)
              const itemDiscount = item.discountPercent || (item.originalPrice && item.price ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100) : 0)
              return (
                <a key={item.id} href={`/product/${item.id}`} className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all">
                  <div className="relative aspect-square overflow-hidden bg-white">
                    {itemImages.length > 0 ? <img src={itemImages[0]} alt={item.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300 mix-blend-multiply" /> : <div className="w-full h-full flex items-center justify-center"><Package className="h-12 w-12 text-gray-200" /></div>}
                    {itemDiscount > 0 && <span className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">{itemDiscount}% OFF</span>}
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-gray-400 mb-1">{item.brand}</p>
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">{item.name}</h3>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-base font-bold text-gray-900">₹{item.price?.toLocaleString("en-IN")}</span>
                      {item.originalPrice > item.price && <span className="text-xs text-gray-400 line-through">₹{item.originalPrice?.toLocaleString("en-IN")}</span>}
                    </div>
                  </div>
                </a>
              )
            })}
            {Array.from({ length: Math.max(0, 4 - recentProducts.length) }).map((_, i) => (
              <div key={`ph-${i}`} className="bg-white rounded-xl border border-dashed border-gray-200 overflow-hidden">
                <div className="aspect-square bg-gradient-to-br from-gray-50 to-white flex items-center justify-center"><Package className="h-12 w-12 text-gray-200" /></div>
                <div className="p-4"><div className="h-3 w-16 bg-gray-100 rounded mb-2" /><div className="h-4 w-full bg-gray-100 rounded mb-2" /><div className="h-4 w-20 bg-gray-100 rounded" /></div>
              </div>
            ))}
          </div>
        </section>

        {/* CUSTOMER REVIEWS */}
        <section className="max-w-4xl mx-auto px-4 mt-12 pb-16">
          <h2 className="text-center text-lg font-medium text-gray-900 mb-2">Customer Reviews</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mt-4 mb-8">
            <div className="text-center">
              <span className="text-4xl font-bold text-gray-900">{avgRating}</span>
              <span className="text-sm text-gray-500 ml-2">{totalReviews} reviews</span>
            </div>
            <div className="space-y-1.5 w-64">
              {ratingBars.map((r) => (
                <div key={r.stars} className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 w-3">{r.stars}</span>
                  <Star className="h-3.5 w-3.5 fill-blue-500 text-blue-500" />
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${(r.count / totalReviews) * 100}%` }} /></div>
                  <span className="text-sm text-gray-500 w-4 text-right">{r.count}</span>
                </div>
              ))}
            </div>
            <button className="px-8 py-3 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-colors">Write a review</button>
          </div>
          <div className="flex items-center justify-end gap-3 mb-6">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"><SlidersHorizontal className="h-3.5 w-3.5" /> Filters</button>
            <select className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white"><option>Most recent</option><option>Highest rated</option><option>Lowest rated</option></select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reviews.map((r) => (
              <div key={r.id} className="border border-gray-200 rounded-xl p-6">
                <StarRating rating={r.rating} size={18} />
                <p className="mt-3 text-sm font-semibold text-gray-900">{r.name}</p>
                <p className="text-xs text-gray-400">{r.date}</p>
                <h4 className="mt-4 text-sm font-bold text-gray-900 leading-tight">{r.title}</h4>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{r.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

      {/* Message Modal */}
      {msgOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMsgOpen(false)} />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">Message Seller</h2>
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[260px]">{product?.name}</p>
              </div>
              <button onClick={() => setMsgOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            {msgSent ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 gap-3">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <p className="text-base font-bold text-gray-900">Message Sent!</p>
                <p className="text-sm text-gray-400 text-center">The seller will get back to you soon.</p>
                <button onClick={() => setMsgOpen(false)} className="mt-2 w-full h-11 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors">
                  Close
                </button>
              </div>
            ) : (
              <div className="px-6 py-5 flex flex-col gap-4">
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  {product?.image && <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover border border-gray-200" />}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{product?.name}</p>
                    <p className="text-xs text-gray-400">₹{product?.price?.toLocaleString("en-IN")}</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Your Message</label>
                  <textarea
                    value={msgText}
                    onChange={e => setMsgText(e.target.value)}
                    placeholder="Ask about condition, availability, meetup location..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 focus:border-gray-900 rounded-xl text-sm text-gray-700 outline-none transition-colors resize-none"
                  />
                </div>
                <button
                  disabled={!msgText.trim() || msgSending}
                  onClick={async () => {
                    if (!msgText.trim()) return
                    setMsgSending(true)
                    try {
                      const token = localStorage.getItem("token")
                      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify({
                          seller_id: productSellerId,
                          type: "message",
                          content: msgText.trim(),
                          product_id: product?.id,
                          product_name: product?.name,
                          product_price: product?.price,
                          product_image: (product?.image && !product.image.startsWith('blob:')) ? product.image : null,
                        })
                      })
                      setMsgSent(true)
                    } catch {
                      setMsgSent(true)
                    } finally {
                      setMsgSending(false)
                    }
                  }}
                  className="w-full h-11 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {msgSending ? (
                    <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Sending...</>
                  ) : "Send Message"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Make an Offer Modal */}
      {offerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOfferOpen(false)} />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">Make an Offer</h2>
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[260px]">{product?.name}</p>
              </div>
              <button onClick={() => setOfferOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            {offerSent ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 gap-3">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <p className="text-base font-bold text-gray-900">Offer Sent!</p>
                <p className="text-sm text-gray-400 text-center">The seller will review your offer and get back to you.</p>
                <button onClick={() => { setOfferOpen(false); window.location.href = '/messages' }} className="mt-2 w-full h-11 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors">
                  View in Messages
                </button>
                <button onClick={() => setOfferOpen(false)} className="w-full h-11 border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-gray-50 transition-colors">
                  Close
                </button>
              </div>
            ) : (
              <div className="px-6 py-5 flex flex-col gap-4">
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Asking Price</span>
                  <span className="text-sm font-bold text-gray-900">₹{product?.price?.toLocaleString("en-IN")}</span>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Your Offer (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₹</span>
                    <input
                      type="number"
                      min="1"
                      value={offerAmount}
                      onChange={e => setOfferAmount(e.target.value)}
                      onKeyDown={e => { if (['e','E','+','-','.'].includes(e.key)) e.preventDefault() }}
                      placeholder="Enter your offer amount"
                      className="w-full h-12 pl-8 pr-4 border-2 border-gray-200 focus:border-gray-900 rounded-xl text-sm font-semibold text-gray-900 outline-none transition-colors"
                    />
                  </div>
                  {product?.price && offerAmount && Number(offerAmount) > 0 && (
                    <p className={`text-xs mt-1 font-medium ${Number(offerAmount) < product.price * 0.7 ? "text-red-500" : "text-green-600"}`}>
                      {Math.round((1 - Number(offerAmount)/product.price)*100)}% below asking
                      {Number(offerAmount) < product.price * 0.7 ? " — seller may decline" : ""}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">Note <span className="text-gray-300 font-normal normal-case">(optional)</span></label>
                  <textarea
                    value={offerNote}
                    onChange={e => setOfferNote(e.target.value)}
                    placeholder="E.g. I can pick up in person, available this weekend..."
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 focus:border-gray-900 rounded-xl text-sm text-gray-700 outline-none transition-colors resize-none"
                  />
                </div>
                <button
                  disabled={!offerAmount || offerSending}
                  onClick={async () => {
                    if (!offerAmount) return
                    setOfferSending(true)
                    try {
                      const token = localStorage.getItem("token")
                      console.log("Sending offer to seller:", productSellerId)
                      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                        body: JSON.stringify({
                          product_id: product?.id,
                          seller_id: productSellerId,
                          type: "offer",
                          offer_amount: Number(offerAmount),
                          note: offerNote,
                          product_name: product?.name,
                          product_price: product?.price,
                          product_image: (product?.image && !product.image.startsWith('blob:')) ? product.image : null,
                        })
                      })
                      console.log("Offer response status:", res.status)
                      setOfferSent(true)
                      setExistingOffer({ amount: Number(offerAmount), note: offerNote, status: undefined })
                      // Store draft so messages page auto-opens this conversation
                      try {
                        sessionStorage.setItem('message_draft', JSON.stringify({
                          receiver_id: productSellerId,
                          seller_name: shop?.shop_name || 'Seller',
                          part_name: product?.name,
                          prefill: ''
                        }))
                      } catch {}
                    } catch (err) {
                      console.error("Offer send error:", err)
                      setOfferSent(true)
                    } finally {
                      setOfferSending(false)
                    }
                  }}
                  className="w-full h-11 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {offerSending ? (
                    <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Sending...</>
                  ) : "Send Offer"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!((product as any)?.partType === "used" || ["used","Used - Like New","Used - Good","Used - Fair","Refurbished"].includes(product?.condition || "")) && <Footer />}
    </div>
  )
}