"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Heart, ShoppingCart, Trash2, Share2, Check, Package, ExternalLink } from "lucide-react"

interface WishlistItem {
  id: string
  name: string
  price: number
  image?: string
  size?: string | null
  condition?: string
}

const API = process.env.NEXT_PUBLIC_API_URL

async function syncWishlistToServer(items: WishlistItem[]) {
  try {
    const token = localStorage.getItem("token")
    if (!token) return
    await fetch(`${API}/api/wishlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ items }),
    })
  } catch {}
}

async function loadWishlistFromServer(): Promise<WishlistItem[]> {
  try {
    const token = localStorage.getItem("token")
    if (!token) return []
    const res = await fetch(`${API}/api/wishlist`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.items || []
  } catch { return [] }
}

export default function WishlistPage() {
  const router = useRouter()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem("user")
    if (!stored) { router.push("/login"); return }

    // Load from server first, fall back to localStorage
    loadWishlistFromServer().then(serverItems => {
      if (serverItems.length > 0) {
        setItems(serverItems)
        localStorage.setItem("wishlist", JSON.stringify(serverItems))
      } else {
        // Fall back to localStorage
        try {
          const local = localStorage.getItem("wishlist")
          const localItems = local ? JSON.parse(local) : []
          setItems(localItems)
          // Sync local items up to server
          if (localItems.length > 0) syncWishlistToServer(localItems)
        } catch {}
      }
      setLoading(false)
    })

    window.addEventListener("wishlist-change", handleWishlistChange)
    return () => window.removeEventListener("wishlist-change", handleWishlistChange)
  }, [])

  const handleWishlistChange = () => {
    try {
      const stored = localStorage.getItem("wishlist")
      setItems(stored ? JSON.parse(stored) : [])
    } catch {}
  }

  const remove = (id: string, size?: string | null) => {
    const updated = items.filter(i => !(i.id === id && i.size === size))
    setItems(updated)
    localStorage.setItem("wishlist", JSON.stringify(updated))
    window.dispatchEvent(new Event("wishlist-change"))
    syncWishlistToServer(updated)
  }

  const moveToCart = (item: WishlistItem) => {
    try {
      const stored = localStorage.getItem("cart")
      const cart = stored ? JSON.parse(stored) : []
      const existing = cart.find((i: any) => i.id === item.id && i.size === item.size)
      if (existing) { existing.quantity += 1 }
      else { cart.push({ id: item.id, name: item.name, price: item.price, image: item.image, size: item.size, quantity: 1 }) }
      localStorage.setItem("cart", JSON.stringify(cart))
      window.dispatchEvent(new Event("cart-change"))
    } catch {}

    remove(item.id, item.size)
    setAddedIds(prev => new Set(prev).add(`${item.id}-${item.size}`))
    setTimeout(() => setAddedIds(prev => { const n = new Set(prev); n.delete(`${item.id}-${item.size}`); return n }), 2000)
  }

  const shareList = async () => {
    const text = items.map(i => `• ${i.name} — ₹${i.price.toLocaleString("en-IN")}${i.size ? ` (${i.size})` : ""}`).join("\n")
    const shareText = `My Partly Saved Parts:\n\n${text}\n\nView on Partly`
    try {
      if (navigator.share) {
        await navigator.share({ title: "My Saved Parts on Partly", text: shareText })
      } else {
        await navigator.clipboard.writeText(shareText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {}
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Heart className="h-6 w-6 text-red-400 fill-red-400" /> Wishlist
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">{items.length} item{items.length !== 1 ? "s" : ""} saved</p>
          </div>
          {items.length > 0 && (
            <button
              onClick={shareList}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {copied ? <><Check className="h-4 w-4 text-green-500" /> Copied!</> : <><Share2 className="h-4 w-4" /> Share List</>}
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <Heart className="h-9 w-9 text-red-300" />
            </div>
            <h2 className="text-lg font-semibold text-gray-700">No saved parts yet</h2>
            <p className="text-sm text-gray-400 mt-1 mb-6">Parts you save will appear here</p>
            <a href="/search" className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
              Browse Parts
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => {
              const key = `${item.id}-${item.size}`
              const justAdded = addedIds.has(key)
              return (
                <div key={key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                  <a href={`/product/${item.id}`} className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden block">
                    {item.image
                      ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Package className="h-6 w-6 text-gray-300" /></div>
                    }
                  </a>
                  <div className="flex-1 min-w-0">
                    <a href={`/product/${item.id}`} className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate block">
                      {item.name}
                    </a>
                    {item.size && <p className="text-xs text-gray-400 mt-0.5">Size: {item.size}</p>}
                    <p className="text-sm font-bold text-gray-900 mt-1">₹{item.price.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a href={`/product/${item.id}`} className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="View product">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => moveToCart(item)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                        justAdded ? "bg-green-100 text-green-700" : item.condition === "used" ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {justAdded ? <><Check className="h-3.5 w-3.5" /> Added</> : <><ShoppingCart className="h-3.5 w-3.5" /> Add to Cart</>}
                    </button>
                    <button onClick={() => remove(item.id, item.size)} className="p-2 text-gray-300 hover:text-red-500 transition-colors" title="Remove">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}