"use client"

import { useEffect, useState } from "react"
import { Heart, MapPin, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { mapDbToProduct } from "@/lib/supabase"

type Product = ReturnType<typeof mapDbToProduct>

const auctions = [
  {
    id: 1,
    name: "Maruti Swift VXI 2018",
    type: "Hatchback",
    currentBid: 285000,
    originalPrice: 450000,
    location: "Mumbai",
    endsIn: "2h 45m",
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&h=300&fit=crop",
  },
  {
    id: 2,
    name: "Honda City ZX 2019",
    type: "Sedan",
    currentBid: 520000,
    originalPrice: 780000,
    location: "Delhi",
    endsIn: "5h 10m",
    image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop",
  },
  {
    id: 3,
    name: "Royal Enfield Classic 350",
    type: "Motorcycle",
    currentBid: 95000,
    originalPrice: 175000,
    location: "Bangalore",
    endsIn: "1h 20m",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
  },
  {
    id: 4,
    name: "Tata Nexon EV 2021",
    type: "SUV",
    currentBid: 890000,
    originalPrice: 1400000,
    location: "Chennai",
    endsIn: "8h 00m",
    image: "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=400&h=300&fit=crop",
  },
]

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [wishlist, setWishlist] = useState<Set<string>>(new Set())

  const loadWishlist = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("wishlist") || "[]")
      setWishlist(new Set(stored.map((i: any) => i.id)))
    } catch {}
  }

  const toggleWishlist = (e: React.MouseEvent, product: Product) => {
    e.preventDefault(); e.stopPropagation()
    try {
      const stored = JSON.parse(localStorage.getItem("wishlist") || "[]")
      const exists = stored.some((i: any) => i.id === product.id)
      let updated
      if (exists) {
        updated = stored.filter((i: any) => i.id !== product.id)
      } else {
        updated = [...stored, { id: product.id, name: product.name, price: product.price, image: product.image || "", condition: product.condition || "new" }]
      }
      localStorage.setItem("wishlist", JSON.stringify(updated))
      setWishlist(new Set(updated.map((i: any) => i.id)))
      window.dispatchEvent(new Event("wishlist-change"))
      // Sync to server
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

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products?limit=8`)
        const json = await res.json()
        if (json.products) setProducts(json.products.map(mapDbToProduct))
      } catch {}
      setLoading(false)
    })()
    loadWishlist()
    window.addEventListener("wishlist-change", loadWishlist)
    return () => window.removeEventListener("wishlist-change", loadWishlist)
  }, [])

  return (
    <div>

      {/* ── SECTION 1: FEATURED PRODUCTS ── */}
      <section className="py-12 px-4 bg-white">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Featured Products
              </h2>
              <p className="text-gray-500 mt-1">
                Top picks from verified sellers across India
              </p>
            </div>
            <Button variant="outline" className="hidden md:flex">
                View All Products
              </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-50 animate-pulse rounded-t-2xl" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 w-3/4 bg-gray-100 rounded" />
                    <div className="h-3 w-1/2 bg-gray-100 rounded" />
                    <div className="h-5 w-1/3 bg-gray-100 rounded" />
                    <div className="h-9 w-full bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">No products available yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => {
                const productImages = [product.image, ...(product.images || [])].filter(Boolean)
                const discount = product.discountPercent || (product.originalPrice && product.price ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0)
                const vehicle = [product.vehicle_make, product.vehicle_model, product.vehicle_year].filter(Boolean).join(" ")

                return (
                  <a
                    key={product.id}
                    href={`/product/${product.id}`}
                    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-gray-200/60 hover:-translate-y-0.5 transition-all duration-300 block"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {/* Gradient background that picks up the image's edge colors */}
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white" />
                      {productImages.length > 0 ? (
                        <img
                          src={productImages[0]}
                          alt={product.name}
                          className="relative w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300 mix-blend-multiply"
                        />
                      ) : (
                        <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
                          <Package className="h-12 w-12 text-gray-200" />
                        </div>
                      )}
                      <button
                        onClick={(e) => toggleWishlist(e, product)}
                        className="absolute top-3 right-3 p-1 transition-colors"
                      >
                        <Heart className={`h-4 w-4 transition-colors ${(((product)?.partType === "used") || ["used", "Used - Like New", "Used - Good", "Used - Fair", "Refurbished"].includes((product)?.condition as string)) ? (wishlist.has(product.id) ? "fill-orange-500 text-orange-500" : "text-orange-400") : (wishlist.has(product.id) ? "fill-blue-500 text-blue-500" : "text-blue-400")}`} />
                      </button>
                      {/* Tags */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        {discount > 0 && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-sm bg-yellow-400 text-yellow-900">
                            {discount}% OFF
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-4">
                      <p className="text-xs text-gray-400 mb-1">{product.brand}</p>
                      <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                      {vehicle && <p className="text-xs text-gray-400 mt-1">{vehicle}</p>}
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-lg font-bold text-gray-900">
                          ₹{product.price?.toLocaleString("en-IN")}
                        </span>

                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          )}

          <div className="flex justify-center mt-8 md:hidden">
            <Button variant="outline">View All Products</Button>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: FEATURED AUCTIONS ── */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Featured Auctions
              </h2>
              <p className="text-gray-500 mt-1">
                Bid on verified vehicles
              </p>
            </div>
            <Button variant="outline" className="hidden md:flex">
              View All Auctions
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {auctions.map((item) => (
              <div
                key={item.id}
                className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button className="absolute top-3 right-3 p-1 transition-colors"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation() }}>
                    <Heart className="h-4 w-4 text-gray-400 hover:text-blue-600" />
                  </button>
                  <span className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                    {item.type}
                  </span>
                  <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                    <span>⏱</span>
                    <span>{item.endsIn}</span>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-1 text-sm mt-1">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-gray-500">{item.location}</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-gray-400">Current Bid</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-gray-900">
                        ₹{item.currentBid.toLocaleString("en-IN")}
                      </span>
                      <span className="text-sm text-gray-400 line-through">
                        ₹{item.originalPrice.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                  <Button className="w-full mt-4 bg-blue-600 text-white hover:bg-blue-700">
                    Place Bid
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-8 md:hidden">
            <Button variant="outline">View All Auctions</Button>
          </div>
        </div>
      </section>

    </div>
  )
}