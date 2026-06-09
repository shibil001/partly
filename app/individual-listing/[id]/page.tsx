"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  ArrowLeft, MessageCircle, MapPin, Shield, Check, Package, User
} from "lucide-react"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"

function Accordion({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-200">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-6 text-left">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 uppercase tracking-wide">{title}</h2>
        {open ? <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" /> : <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />}
      </button>
      {open && <div className="pb-8">{children}</div>}
    </div>
  )
}

export default function IndividualListingViewPage() {
  const { id } = useParams()
  const router = useRouter()
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [msgSending, setMsgSending] = useState(false)
  const [msgSent, setMsgSent] = useState(false)

  useEffect(() => {
    try { const u = localStorage.getItem("user"); if (u) setCurrentUser(JSON.parse(u)) } catch {}
    fetchListing()
  }, [id])

  const fetchListing = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/individual-listings/${id}`)
      const data = await res.json()
      setListing(data.listing)
    } catch {}
    finally { setLoading(false) }
  }

  const handleMessage = async () => {
    if (!currentUser) { router.push("/login"); return }
    if (!listing) return
    sessionStorage.setItem("message_draft", JSON.stringify({
      receiver_id: listing.user_id,
      seller_name: listing.users?.full_name || listing.users?.username || "Seller",
      part_name: listing.title,
      prefill: `Hi! I'm interested in your listing: ${listing.title}. Is it still available?`
    }))
    router.push("/messages")
  }

  if (loading) return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-10 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-square bg-gray-100 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-6 bg-gray-100 rounded w-1/2" />
            <div className="h-10 bg-gray-100 rounded w-3/4" />
            <div className="h-16 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    </div>
  )

  if (!listing) return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Listing not found</p>
      </div>
      <Footer />
    </div>
  )

  const images = [
    ...(listing.images || [])
  ].filter(Boolean)

  const discount = listing.original_price && listing.price
    ? Math.round((1 - listing.price / listing.original_price) * 100)
    : 0

  const specRows = [
    { label: "Condition", value: listing.condition },
    { label: "Category", value: listing.category },
    { label: "Brand", value: listing.brand },
    { label: "Part Number", value: listing.part_number },
    { label: "Vehicle Model", value: listing.vehicle_model },
    { label: "Year", value: listing.year },
    { label: "Fitment", value: listing.fitment },
    { label: "Material", value: listing.material },
    { label: "Colour", value: listing.colour },
    { label: "Weight", value: listing.weight },
    { label: "Measurements", value: listing.measurements },
    { label: "Includes", value: listing.includes },
  ].filter(s => s.value)

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">

          {/* LEFT — Images */}
          <div>
            <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
              {images.length > 0 ? (
                <img src={images[selectedImage]} alt="" className="w-full h-full object-contain p-4" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-20 h-20 text-gray-200" />
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button onClick={() => setSelectedImage(i => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 transition-colors">
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <button onClick={() => setSelectedImage(i => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 transition-colors">
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
                {images.map((src: string, i: number) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${i === selectedImage ? "border-blue-600 ring-2 ring-blue-100" : "border-gray-200 hover:border-gray-300"}`}>
                    <img src={src} alt="" className="w-full h-full object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — Info */}
          <div className="flex flex-col">
            {/* Discount badge only */}
            {discount > 0 && (
              <div className="mb-4">
                <span className="px-2.5 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full uppercase">{discount}% Off</span>
              </div>
            )}

            <p className="text-sm text-gray-400 mb-1">{[listing.brand, listing.part_number ? `Part #${listing.part_number}` : ""].filter(Boolean).join("  |  ")}</p>

            <h1 className="text-xl md:text-2xl font-bold text-gray-900 uppercase tracking-tight leading-snug mb-4">
              {listing.title}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-5">
              <span className="text-3xl font-bold text-gray-900">₹{listing.price?.toLocaleString("en-IN")}</span>
              {listing.original_price > listing.price && (
                <span className="text-lg text-gray-400 line-through">₹{listing.original_price?.toLocaleString("en-IN")}</span>
              )}
            </div>

            {/* Quick specs */}
            {(listing.vehicle_model || listing.fitment || listing.location) && (
              <div className="space-y-2 mb-5">
                {listing.vehicle_model && <div className="flex items-center gap-2 text-sm text-gray-600"><Check className="h-4 w-4 text-blue-600" /> Fits: {listing.vehicle_model} {listing.year}</div>}
                {listing.location && <div className="flex items-center gap-2 text-sm text-gray-600"><MapPin className="h-4 w-4 text-blue-600" /> {listing.location}</div>}
              </div>
            )}



            {/* Seller card */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {(listing.users?.full_name || listing.users?.username || "U")[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{listing.users?.full_name || listing.users?.username || "Anonymous"}</p>
                  {listing.users?.username && <p className="text-xs text-gray-400">@{listing.users.username} · Individual Seller</p>}
                </div>
              </div>
              {currentUser?.id !== listing.user_id && (
                <button onClick={handleMessage}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold rounded-xl transition-colors shrink-0">
                  Message
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom accordions */}
        <div className="mt-12 border-t border-gray-200">

          {/* Description */}
          {listing.description && (
            <Accordion title="Description" defaultOpen>
              <p className="text-sm text-gray-600 leading-relaxed">{listing.description}</p>
            </Accordion>
          )}

          {/* Specifications */}
          {specRows.length > 0 && (
            <Accordion title="Specifications" defaultOpen={!listing.description}>
              {specRows.map((row, i) => (
                <div key={i} className="flex items-center justify-between py-4 border-b border-dotted border-gray-200 last:border-b-0">
                  <span className="text-sm font-semibold text-gray-900">{row.label}</span>
                  <span className="text-sm text-gray-600 text-right">{row.value}</span>
                </div>
              ))}
            </Accordion>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}