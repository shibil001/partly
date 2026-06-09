"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Car, Eye, Trash2, Plus, Pencil, X } from "lucide-react"

interface Vehicle {
  id: string
  title: string
  vehicle_type: string
  make: string
  model: string
  year: string
  variant: string
  fuel_type: string
  transmission: string
  km_driven: number
  color: string
  condition: string
  price: number
  location: string
  description: string
  images: string[]
  video_url: string
  noc_available: string
  engine: string
  owners: string
  registration_year: string
  rto_state: string
  mileage: string
  status: string
  created_at: string
}

export default function MyMarketListingsPage() {
  const router = useRouter()
  const [listings, setListings] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [editForm, setEditForm] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    try {
      const u = localStorage.getItem("user")
      if (!u) { router.push("/login"); return }
    } catch { router.push("/login") }
    fetchListings()
  }, [])

  const startEdit = (v: Vehicle) => {
    setEditForm({
      title: v.title || "", vehicle_type: v.vehicle_type || "", make: v.make || "",
      model: v.model || "", year: v.year || "", variant: v.variant || "",
      fuel_type: v.fuel_type || "", transmission: v.transmission || "",
      km_driven: v.km_driven?.toString() || "", color: v.color || "",
      condition: v.condition || "", price: v.price?.toString() || "",
      location: v.location || "", description: v.description || "",
      video_url: v.video_url || "", noc_available: v.noc_available || "",
      engine: v.engine || "", owners: v.owners || "",
      registration_year: v.registration_year || "", rto_state: v.rto_state || "",
      images: v.images || []
    })
    setEditingVehicle(v)
  }

  const saveEdit = async () => {
    if (!editingVehicle) return
    setSaving(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/market/${editingVehicle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...editForm, price: Number(editForm.price), km_driven: editForm.km_driven ? Number(editForm.km_driven) : null })
      })
      if (res.ok) {
        setEditingVehicle(null)
        setEditForm(null)
        fetchListings()
      }
    } catch {}
    finally { setSaving(false) }
  }

  const fetchListings = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/market/my`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setListings(data.vehicles || [])
    } catch {}
    finally { setLoading(false) }
  }

  const deleteListing = async (id: string) => {
    const token = localStorage.getItem("token")
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/market/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` }
      })
      setListings(prev => prev.filter(l => l.id !== id))
      setDeleteId(null)
    } catch {}
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Vehicle Listings</h1>
            <p className="text-sm text-gray-400 mt-0.5">{listings.length} listing{listings.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={() => router.push("/market?list=1")}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl transition-all">
            <Plus className="w-4 h-4" /> List Vehicle
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-28 bg-white rounded-xl border border-gray-200 animate-pulse" />)}</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <Car className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="font-medium text-gray-400">No listings yet</p>
            <p className="text-sm text-gray-300 mt-1">Click "List Vehicle" to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map(l => (
              <div key={l.id} className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  {l.images?.[0]
                    ? <img src={l.images[0]} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Car className="w-8 h-8 text-gray-300" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{l.title}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{[l.make, l.model, l.year].filter(Boolean).join(" · ")}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => window.open(`/market/${l.id}`, "_blank")}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => startEdit(l)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteId(l.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-sm font-bold text-gray-900">₹{l.price?.toLocaleString("en-IN")}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${l.condition === "Excellent" ? "bg-green-50 text-green-600" : l.condition === "Good" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-600"}`}>{l.condition}</span>
                    <span className="text-[10px] text-gray-300">{new Date(l.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />

      {/* Edit Modal */}
      {editingVehicle && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditingVehicle(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-900">Edit Listing</h2>
              <button onClick={() => setEditingVehicle(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: "Title", key: "title", placeholder: "Listing title" },
                { label: "Make", key: "make", placeholder: "e.g. Honda" },
                { label: "Model", key: "model", placeholder: "e.g. City" },
                { label: "Year", key: "year", placeholder: "e.g. 2019" },
                { label: "Variant", key: "variant", placeholder: "e.g. VX" },
                { label: "Color", key: "color", placeholder: "e.g. White" },
                { label: "Engine", key: "engine", placeholder: "e.g. 1497cc" },
                { label: "KMs Driven", key: "km_driven", placeholder: "e.g. 45000" },
                { label: "Registration Year", key: "registration_year", placeholder: "e.g. 2019" },
                { label: "RTO State", key: "rto_state", placeholder: "e.g. KL" },
                { label: "Location", key: "location", placeholder: "City" },
                { label: "Price (₹)", key: "price", placeholder: "e.g. 450000" },
                { label: "Video Link", key: "video_url", placeholder: "YouTube or Drive link" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">{f.label}</label>
                  <input value={editForm[f.key]} onChange={e => setEditForm((ef: any) => ({ ...ef, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
              ))}
              {/* Selects */}
              {[
                { label: "Condition", key: "condition", options: ["Excellent", "Good", "Fair", "Needs Work"] },
                { label: "Fuel Type", key: "fuel_type", options: ["Petrol", "Diesel", "Electric", "CNG", "LPG", "Hybrid"] },
                { label: "Transmission", key: "transmission", options: ["Manual", "Automatic", "Semi-Automatic"] },
                { label: "Owners", key: "owners", options: ["1st Owner", "2nd Owner", "3rd Owner", "4th Owner or more"] },
                { label: "NOC Available", key: "noc_available", options: ["Yes", "No"] },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">{f.label}</label>
                  <select value={editForm[f.key]} onChange={e => setEditForm((ef: any) => ({ ...ef, [f.key]: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                    <option value="">Select</option>
                    {f.options.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm((ef: any) => ({ ...ef, description: e.target.value }))}
                  rows={3} placeholder="Describe the vehicle..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingVehicle(null)} className="flex-1 py-3 border border-gray-200 text-sm text-gray-600 font-medium rounded-xl hover:bg-gray-50">Cancel</button>
                <button onClick={saveEdit} disabled={saving} className="flex-1 py-3 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-bold text-gray-900 mb-2">Delete Listing?</h3>
            <p className="text-sm text-gray-500 mb-5">This will permanently remove your vehicle listing.</p>
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