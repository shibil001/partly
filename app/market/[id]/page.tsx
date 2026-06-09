"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import {
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, X,
  MessageCircle, MapPin, Fuel, Gauge, Calendar, Car,
  Settings, Palette, Users
} from "lucide-react"

function Accordion({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-200">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-5 text-left">
        <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">{title}</h2>
        {open ? <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" /> : <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />}
      </button>
      {open && <div className="pb-6">{children}</div>}
    </div>
  )
}

export default function MarketVehiclePage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  const [vehicle, setVehicle] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [offerAmount, setOfferAmount] = useState("")
  const [offerNote, setOfferNote] = useState("")
  const [offerSending, setOfferSending] = useState(false)
  const [offerSent, setOfferSent] = useState(false)

  useEffect(() => {
    try { const u = localStorage.getItem("user"); if (u) setCurrentUser(JSON.parse(u)) } catch {}
    fetchVehicle()
  }, [id])

  const fetchVehicle = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/market/${id}`)
      const data = await res.json()
      setVehicle(data.vehicle)
      // Track activity
      if (data.vehicle) {
        try {
          const token = localStorage.getItem("token")
          if (token) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/market/activity`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ vehicle_type: data.vehicle.vehicle_type, make: data.vehicle.make })
            })
          }
        } catch {}
      }
    } catch {}
    finally { setLoading(false) }
  }

  const handleMessage = () => {
    if (!currentUser) { router.push("/login"); return }
    if (!vehicle) return
    sessionStorage.setItem("message_draft", JSON.stringify({
      receiver_id: vehicle.user_id,
      seller_name: vehicle.users?.full_name || vehicle.users?.username || "Seller",
      part_name: vehicle.title,
      prefill: `Hi! I'm interested in your ${vehicle.title}. Is it still available?`
    }))
    router.push("/messages")
  }

  const sendOffer = async () => {
    if (!offerAmount) return
    setOfferSending(true)
    try {
      const token = localStorage.getItem("token")
      const msg = `Hi! I would like to make an offer for your ${vehicle.title}.\n\nMy Offer: ₹${Number(offerAmount).toLocaleString("en-IN")}${offerNote ? `\n\nNote: ${offerNote}` : ""}`
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ receiver_id: vehicle.user_id, type: "message", content: msg, product_name: vehicle.title, product_id: vehicle.id, product_image: vehicle.images?.[0] || null })
      })
      setOfferSent(true)
      setTimeout(() => { setShowOfferModal(false); setOfferSent(false); setOfferAmount(""); setOfferNote("") }, 2000)
    } catch {}
    finally { setOfferSending(false) }
  }

  if (loading) return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-10 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-[4/3] bg-gray-100 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-100 rounded w-3/4" />
            <div className="h-10 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
      </div>
    </div>
  )

  if (!vehicle) return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Vehicle not found</p>
      </div>
      <Footer />
    </div>
  )

  const images = vehicle.images?.length ? vehicle.images : []

  const specs = [
    { icon: <Car className="w-4 h-4" />, label: "Vehicle Type", value: vehicle.vehicle_type },
    { icon: <Calendar className="w-4 h-4" />, label: "Year", value: vehicle.year },
    { icon: <Fuel className="w-4 h-4" />, label: "Fuel Type", value: vehicle.fuel_type },
    { icon: <Settings className="w-4 h-4" />, label: "Transmission", value: vehicle.transmission },
    { icon: <Gauge className="w-4 h-4" />, label: "KMs Driven", value: vehicle.km_driven ? `${Number(vehicle.km_driven).toLocaleString("en-IN")} km` : null },
    { icon: <Settings className="w-4 h-4" />, label: "Engine", value: vehicle.engine },
    { icon: <Palette className="w-4 h-4" />, label: "Color", value: vehicle.color },
    { icon: <Users className="w-4 h-4" />, label: "Variant", value: vehicle.variant },
    { icon: <MapPin className="w-4 h-4" />, label: "Location", value: vehicle.location },
    { icon: <Car className="w-4 h-4" />, label: "NOC Available", value: vehicle.noc_available },
    { icon: <Users className="w-4 h-4" />, label: "Number of Owners", value: vehicle.owners },
    { icon: <Calendar className="w-4 h-4" />, label: "Registration Year", value: vehicle.registration_year },
    { icon: <MapPin className="w-4 h-4" />, label: "RTO / Reg. State", value: vehicle.rto_state },
    { icon: <Gauge className="w-4 h-4" />, label: "Mileage", value: vehicle.mileage ? vehicle.mileage + " km/l" : null },
  ].filter(s => s.value)

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">

          {/* LEFT — Image Gallery */}
          <div>
            <div className="relative aspect-[4/3] bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
              {images.length > 0 ? (
                <img src={images[selectedImage]} alt="" onClick={() => { setLightboxIndex(selectedImage); setLightboxOpen(true) }} className="w-full h-full object-cover cursor-zoom-in" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Car className="w-20 h-20 text-gray-200" />
                </div>
              )}

              {/* Condition badge */}
              <div className="absolute top-3 left-3 z-10">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${vehicle.condition === "Excellent" ? "bg-green-500 text-white" : vehicle.condition === "Good" ? "bg-blue-500 text-white" : "bg-gray-700 text-white"}`}>
                  {vehicle.condition}
                </span>
              </div>

              {images.length > 1 && (
                <>
                  <button onClick={() => setSelectedImage(i => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow border border-gray-100">
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  <button onClick={() => setSelectedImage(i => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow border border-gray-100">
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                  <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                    {selectedImage + 1} / {images.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {images.map((src: string, i: number) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === selectedImage ? "border-gray-900" : "border-transparent hover:border-gray-300"}`}>
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — Info */}
          <div className="flex flex-col gap-4">

            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{vehicle.title}</h1>
              <p className="text-gray-400 text-sm mt-1">{[vehicle.make, vehicle.model, vehicle.variant, vehicle.year].filter(Boolean).join(" · ")}</p>
            </div>

            {/* Location & date */}
            <div className="flex items-center gap-4 text-sm text-gray-400">
              {vehicle.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{vehicle.location}</span>}
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(vehicle.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
            </div>

            {/* Price */}
            <div className="text-3xl font-bold text-gray-900">
              ₹{vehicle.price?.toLocaleString("en-IN")}
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3">
              {vehicle.fuel_type && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                  <Fuel className="w-4 h-4 text-gray-400" />
                  <div><p className="text-[10px] text-gray-400">Fuel</p><p className="text-xs font-semibold text-gray-900">{vehicle.fuel_type}</p></div>
                </div>
              )}
              {vehicle.km_driven && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                  <Gauge className="w-4 h-4 text-gray-400" />
                  <div><p className="text-[10px] text-gray-400">KMs Driven</p><p className="text-xs font-semibold text-gray-900">{Number(vehicle.km_driven).toLocaleString("en-IN")} km</p></div>
                </div>
              )}
              {vehicle.transmission && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                  <Settings className="w-4 h-4 text-gray-400" />
                  <div><p className="text-[10px] text-gray-400">Transmission</p><p className="text-xs font-semibold text-gray-900">{vehicle.transmission}</p></div>
                </div>
              )}
              {vehicle.color && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                  <Palette className="w-4 h-4 text-gray-400" />
                  <div><p className="text-[10px] text-gray-400">Color</p><p className="text-xs font-semibold text-gray-900">{vehicle.color}</p></div>
                </div>
              )}
            </div>



            {/* Make an Offer button */}
            {currentUser?.id !== vehicle.user_id && (
              <button
                onClick={() => { if (!currentUser) { router.push("/login"); return } setShowOfferModal(true) }}
                className="w-full py-3 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl transition-colors active:scale-95"
              >
                Make an Offer
              </button>
            )}

            {/* Seller card */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {(vehicle.users?.full_name || vehicle.users?.username || "U")[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{vehicle.users?.full_name || vehicle.users?.username || "Anonymous"}</p>
                  {vehicle.users?.username && <p className="text-xs text-gray-400">@{vehicle.users.username}</p>}
                </div>
              </div>
              {currentUser?.id !== vehicle.user_id && (
                <button onClick={handleMessage}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold rounded-xl transition-colors shrink-0">
                  Message
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Video Link */}
        {vehicle.video_url && (
          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Vehicle Video</p>
              <p className="text-sm text-gray-600">Watch a video of this vehicle</p>
            </div>
            <a href={vehicle.video_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl transition-colors shrink-0">
              Watch Video →
            </a>
          </div>
        )}

        {/* Accordions */}
        <div className="mt-10 border-t border-gray-200">
          {vehicle.description && (
            <Accordion title="Description" defaultOpen>
              <p className="text-sm text-gray-600 leading-relaxed">{vehicle.description}</p>
            </Accordion>
          )}
          {specs.length > 0 && (
            <Accordion title="Specifications" defaultOpen={!vehicle.description}>
              <div className="divide-y divide-gray-100">
                {specs.map((spec, i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-2 text-gray-400">{spec.icon}<span className="text-sm">{spec.label}</span></div>
                    <span className="text-sm font-semibold text-gray-900">{spec.value}</span>
                  </div>
                ))}
              </div>
            </Accordion>
          )}
        </div>
      </main>
      <Footer />

      {/* Make an Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowOfferModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 uppercase">Make an Offer</h3>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{vehicle.title}</p>
              </div>
              <button onClick={() => setShowOfferModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 shrink-0">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Asking price */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl mb-4">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Asking Price</span>
              <span className="text-sm font-bold text-gray-900">₹{vehicle.price?.toLocaleString("en-IN")}</span>
            </div>

            {offerSent ? (
              <div className="text-center py-6">
                <p className="text-green-600 font-semibold text-lg">✓ Offer Sent!</p>
                <p className="text-xs text-gray-400 mt-1">The seller will respond via messages</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block">Your Offer (₹)</label>
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-gray-900">
                    <span className="pl-4 text-gray-400 text-sm">₹</span>
                    <input type="number" value={offerAmount} onChange={e => setOfferAmount(e.target.value)}
                      placeholder="Enter your offer" className="flex-1 px-3 py-3 text-sm focus:outline-none" />
                  </div>
                </div>
                <div className="mb-5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block">Note <span className="font-normal text-gray-400">(optional)</span></label>
                  <textarea value={offerNote} onChange={e => setOfferNote(e.target.value)}
                    placeholder="Any message to the seller..." rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
                </div>
                <button onClick={sendOffer} disabled={!offerAmount || offerSending}
                  className="w-full py-3 bg-gray-900 hover:bg-gray-700 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50">
                  {offerSending ? "Sending..." : "Send Offer"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95" onClick={() => setLightboxOpen(false)}>
          <button onClick={() => setLightboxOpen(false)} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white">
            <X className="w-5 h-5" />
          </button>
          {images.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i - 1 + images.length) % images.length) }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i + 1) % images.length) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white">
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          <div className="max-w-5xl max-h-[90vh] w-full mx-16 flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <img src={images[lightboxIndex]} alt="" className="max-w-full max-h-[90vh] object-contain rounded-xl" />
          </div>
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_: string, i: number) => (
                <button key={i} onClick={e => { e.stopPropagation(); setLightboxIndex(i) }}
                  className={`w-2 h-2 rounded-full transition-colors ${i === lightboxIndex ? "bg-white" : "bg-white/40"}`} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}