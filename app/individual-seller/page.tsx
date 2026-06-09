"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Plus, X, Trash2, Upload, ChevronUp, Eye } from "lucide-react"

const IMGBB_KEY = "02b4c7432d64053cdaebd47e3a9918ab"

const CONDITIONS = ["Used - Like New", "Used - Good", "Used - Fair", "Used - Poor", "Refurbished"]
const CATEGORIES = ["Engine Parts", "Transmission", "Brakes", "Suspension", "Electrical", "Body Parts", "Exhaust", "Cooling", "Fuel System", "Steering", "Wheels & Tyres", "Lights", "Interior", "Accessories", "Other"]

interface Listing {
  id: string
  user_id: string
  title: string
  description?: string
  price: number
  original_price?: number
  condition: string
  category?: string
  brand?: string
  part_number?: string
  vehicle_model?: string
  year?: string
  fitment?: string
  material?: string
  colour?: string
  weight?: string
  measurements?: string
  includes?: string
  location?: string
  images: string[]
  status: string
  created_at: string
  expires_at: string
  users?: { full_name: string; username: string; avatar_url?: string }
}

const emptyForm = {
  title: "", description: "", price: "", originalPrice: "", condition: "",
  category: "", brand: "", partNumber: "", vehicleModel: "", year: "",
  fitment: "", material: "", colour: "", weight: "", measurements: "",
  includes: "", location: "", images: [] as string[],
}

const inp = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"

const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="text-xs font-semibold text-gray-600 mb-1 block">{label}</label>
    {children}
  </div>
)

export default function IndividualSellerPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [form, setForm] = useState({ ...emptyForm, images: [] as string[] })
  const [formError, setFormError] = useState("")
  const [listingCount, setListingCount] = useState<number | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    try {
      const u = localStorage.getItem("user")
      if (!u) { router.push("/login"); return }
      setCurrentUser(JSON.parse(u))
    } catch { router.push("/login") }
    fetchListings()
  }, [])

  const fetchListings = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/individual-listings/my`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setListings(data.listings || [])
      setListingCount(data.count || 0)
    } catch {}
    finally { setLoading(false) }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setFormError("Image must be under 5MB"); return }
    if (form.images.length >= 5) { setFormError("Maximum 5 images allowed"); return }
    setUploadingImage(true)
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(",")[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const formData = new FormData()
      formData.append("image", base64)
      formData.append("key", IMGBB_KEY)
      const res = await fetch("https://api.imgbb.com/1/upload", { method: "POST", body: formData })
      const imgData = await res.json()
      if (imgData.success) setForm(f => ({ ...f, images: [...f.images, imgData.data.url] }))
      else setFormError("Image upload failed")
    } catch { setFormError("Image upload failed") }
    finally { setUploadingImage(false) }
  }

  const submitListing = async () => {
    if (!form.title.trim()) { setFormError("Title is required"); return }
    if (!form.price) { setFormError("Price is required"); return }
    if (!form.condition) { setFormError("Condition is required"); return }
    setFormError(""); setSubmitting(true)
    try {
      const token = localStorage.getItem("token")
      const url = editingId
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/individual-listings/${editingId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/individual-listings`
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, price: Number(form.price), original_price: form.originalPrice ? Number(form.originalPrice) : null })
      })
      if (res.status === 402) { setShowForm(false); setShowPaymentModal(true); return }
      if (res.ok) {
        setForm({ ...emptyForm, images: [] })
        setShowForm(false)
        setEditingId(null)
        fetchListings()
      }
    } catch {}
    finally { setSubmitting(false) }
  }

  const deleteListing = async (id: string) => {
    const token = localStorage.getItem("token")
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/individual-listings/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` }
      })
      setListings(prev => prev.filter(l => l.id !== id))
      setListingCount(c => Math.max(0, (c || 1) - 1))
      setDeleteId(null)
    } catch {}
  }

  const startEdit = (listing: Listing) => {
    setForm({
      title: listing.title || "",
      description: listing.description || "",
      price: listing.price?.toString() || "",
      originalPrice: listing.original_price?.toString() || "",
      condition: listing.condition || "",
      category: listing.category || "",
      brand: listing.brand || "",
      partNumber: listing.part_number || "",
      vehicleModel: listing.vehicle_model || "",
      year: listing.year || "",
      fitment: listing.fitment || "",
      material: listing.material || "",
      colour: listing.colour || "",
      weight: listing.weight || "",
      measurements: listing.measurements || "",
      includes: listing.includes || "",
      location: listing.location || "",
      images: listing.images || [],
    })
    setEditingId(listing.id)
    setShowForm(true)
  }

  const timeLeft = (expires_at: string) => {
    const diff = new Date(expires_at).getTime() - Date.now()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days < 0) return "Expired"
    if (days === 0) return "Expires today"
    return `${days} days left`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Individual Seller</h1>
            <p className="text-sm text-gray-400 mt-0.5">List up to 3 parts without a shop</p>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <button
              onClick={() => { setEditingId(null); setForm({ ...emptyForm, images: [] }); setShowForm(true) }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> List a Part
            </button>
            {listingCount !== null && (
              <p className="text-[10px] text-gray-400">
                {listingCount < 3 ? `${3 - listingCount} free remaining` : "₹29 per listing"}
              </p>
            )}
          </div>
        </div>

        {/* Listings */}
        {loading ? (
          <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-28 bg-white rounded-xl border border-gray-200 animate-pulse" />)}</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <Upload className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="font-medium text-gray-400">No listings yet</p>
            <p className="text-sm text-gray-300 mt-1">Click "List a Part" to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map(l => (
              <div key={l.id} className={`bg-white rounded-xl border p-4 flex gap-4 ${l.expires_at && new Date(l.expires_at) < new Date() ? "border-red-200 opacity-70" : "border-gray-200"}`}>
                {l.images?.[0] && <img src={l.images[0]} alt="" className="w-20 h-20 object-cover rounded-lg shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{l.title}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{l.condition} {l.category ? `· ${l.category}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => window.open(`/individual-listing/${l.id}`, "_blank")} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                      <button onClick={() => startEdit(l)} className="text-xs text-blue-500 hover:underline px-2">Edit</button>
                      <button onClick={() => setDeleteId(l.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-sm font-bold text-gray-900">₹{l.price?.toLocaleString("en-IN")}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${l.expires_at && new Date(l.expires_at) < new Date() ? "bg-red-100 text-red-500" : "bg-green-50 text-green-600"}`}>
                      {l.expires_at ? timeLeft(l.expires_at) : "Active"}
                    </span>
                    <span className="text-[10px] bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full">{l.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Listing Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? "Edit Listing" : "List a Part"}</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {formError && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl">{formError}</p>}

              {/* Images */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-2 block">Photos (up to 5)</label>
                <div className="grid grid-cols-5 gap-2">
                  {form.images.map((img, i) => (
                    <div key={i} className="relative aspect-square">
                      <img src={img} alt="" className="w-full h-full object-cover rounded-xl border border-gray-200" />
                      <button onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  {form.images.length < 5 && (
                    <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                      <Plus className="w-5 h-5 text-gray-400" />
                      <span className="text-[10px] text-gray-400">{uploadingImage ? "Uploading..." : "Add"}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                    </label>
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Basic Info</p>
              <F label="Part Name *"><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Honda City Front Bumper" className={inp} /></F>
              <F label="Description"><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Describe the part, any damage, reason for selling..." className={inp + " resize-none"} /></F>
              <div className="grid grid-cols-2 gap-3">
                <F label="Selling Price (₹) *"><input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="e.g. 2500" className={inp} /></F>
                <F label="Original Price (₹)"><input type="number" value={form.originalPrice} onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))} placeholder="e.g. 5000" className={inp} /></F>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="Condition *">
                  <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))} className={inp}>
                    <option value="">Select condition</option>
                    {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </F>
                <F label="Category">
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inp}>
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </F>
              </div>

              {/* Part Details */}
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pt-1">Part Details</p>
              <div className="grid grid-cols-2 gap-3">
                <F label="Brand"><input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="e.g. Honda" className={inp} /></F>
                <F label="Part Number"><input value={form.partNumber} onChange={e => setForm(f => ({ ...f, partNumber: e.target.value }))} placeholder="e.g. 71101-T9A-000" className={inp} /></F>
                <F label="Vehicle Model"><input value={form.vehicleModel} onChange={e => setForm(f => ({ ...f, vehicleModel: e.target.value }))} placeholder="e.g. Honda City 2019" className={inp} /></F>
                <F label="Year"><input value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} placeholder="e.g. 2019" className={inp} /></F>
                <F label="Material"><input value={form.material} onChange={e => setForm(f => ({ ...f, material: e.target.value }))} placeholder="e.g. Steel" className={inp} /></F>
                <F label="Colour"><input value={form.colour} onChange={e => setForm(f => ({ ...f, colour: e.target.value }))} placeholder="e.g. Silver" className={inp} /></F>
                <F label="Weight"><input value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} placeholder="e.g. 2.5 kg" className={inp} /></F>
                <F label="Measurements"><input value={form.measurements} onChange={e => setForm(f => ({ ...f, measurements: e.target.value }))} placeholder="e.g. 45x20x10 cm" className={inp} /></F>
              </div>
              <F label="Fitment"><input value={form.fitment} onChange={e => setForm(f => ({ ...f, fitment: e.target.value }))} placeholder="e.g. Honda City 2017-2021" className={inp} /></F>
              <F label="Includes"><input value={form.includes} onChange={e => setForm(f => ({ ...f, includes: e.target.value }))} placeholder="e.g. Mounting hardware, clips" className={inp} /></F>
              <F label="Location"><input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="City, Pincode" className={inp} /></F>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-3 border border-gray-200 text-sm text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={submitListing} disabled={submitting} className="flex-1 py-3 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
                  {submitting ? "Saving..." : editingId ? "Update Listing" : "Publish Listing"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">₹</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Free limit reached</h3>
            <p className="text-sm text-gray-500 mb-5">Each additional listing costs <span className="font-bold text-gray-900">₹29</span> and stays active for <span className="font-bold text-gray-900">90 days</span>.</p>
            <button onClick={() => { setShowPaymentModal(false); alert("Payment coming soon!") }} className="w-full py-3 bg-gray-900 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors mb-3">
              Pay ₹29 & List Part
            </button>
            <button onClick={() => setShowPaymentModal(false)} className="w-full py-2.5 border border-gray-200 text-sm text-gray-600 rounded-xl hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-bold text-gray-900 mb-2">Delete Listing?</h3>
            <p className="text-sm text-gray-500 mb-5">This will permanently remove your listing.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-gray-200 text-sm font-semibold text-gray-600 rounded-xl hover:bg-gray-50">Cancel</button>
              <button onClick={() => deleteListing(deleteId)} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}