"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Header } from "@/components/header"
import { Plus, X, Search, SlidersHorizontal, MapPin, Fuel, Gauge, Calendar, Car } from "lucide-react"

const IMGBB_KEY = "02b4c7432d64053cdaebd47e3a9918ab"

const VEHICLE_TYPES = ["Car", "Bike", "Truck", "Auto-Rickshaw", "Tractor", "Bus", "Van", "SUV", "Scooter", "Electric Vehicle", "Other"]
const FUEL_TYPES = ["Petrol", "Diesel", "Electric", "CNG", "LPG", "Hybrid"]
const TRANSMISSION = ["Manual", "Automatic", "Semi-Automatic"]
const CONDITIONS = ["Excellent", "Good", "Fair", "Needs Work"]
const SORT_OPTIONS = [
  { label: "Latest", value: "latest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "KMs: Low to High", value: "km_asc" },
]

const inp = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
const sel = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="text-xs font-semibold text-gray-600 mb-1 block">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
    {children}
  </div>
)

interface Vehicle {
  id: string
  user_id: string
  title: string
  vehicle_type: string
  make: string
  model: string
  year: string
  variant?: string
  fuel_type?: string
  transmission?: string
  km_driven?: number
  color?: string
  condition: string
  price: number
  location?: string
  description?: string
  images: string[]
  status: string
  created_at: string
  users?: { full_name: string; username: string; avatar_url?: string }
}

function MarketPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [formError, setFormError] = useState("")
  const [listingCount, setListingCount] = useState<number | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [search, setSearch] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState("latest")
  const [filterType, setFilterType] = useState("")
  const [filterFuel, setFilterFuel] = useState("")
  const [filterMinPrice, setFilterMinPrice] = useState("")
  const [filterMaxPrice, setFilterMaxPrice] = useState("")
  const [filterYear, setFilterYear] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [userLocation, setUserLocation] = useState("")
  const [locationLoading, setLocationLoading] = useState(true)
  const [showLocationEdit, setShowLocationEdit] = useState(false)
  const [locationInput, setLocationInput] = useState("")
  const [savingLocation, setSavingLocation] = useState(false)
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([])
  const [listingLocationSuggestions, setListingLocationSuggestions] = useState<string[]>([])
  const [fetchingListingSuggestions, setFetchingListingSuggestions] = useState(false)
  const [fetchingSuggestions, setFetchingSuggestions] = useState(false)
  const [form, setForm] = useState({
    title: "", vehicle_type: "", make: "", model: "", year: "",
    variant: "", fuel_type: "", transmission: "", km_driven: "",
    color: "", condition: "", price: "", location: "", description: "",
    images: [] as string[],
    video_url: "",
    noc_available: "",
    engine: "",
    owners: "",
    registration_year: "",
    rto_state: "",
    mileage: ""
  })

  useEffect(() => {
    try { const u = localStorage.getItem("user"); if (u) setCurrentUser(JSON.parse(u)) } catch {}
    fetchVehicles()
    fetchCount()
    loadUserLocation()
    if (searchParams.get("list") === "1") setShowForm(true)
  }, [])

  const loadUserLocation = async () => {
    const token = localStorage.getItem("token")
    if (!token) { setLocationLoading(false); return }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/market/user-location`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.location) { 
        setUserLocation(data.location)
        setLocationInput(data.location)
      } else {
        // No location saved yet — auto detect
        autoDetectLocation()
      }
    } catch {}
    finally { setLocationLoading(false) }
  }

  const autoDetectLocation = async () => {
    const token = localStorage.getItem("token")
    if (!token) return
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const { latitude, longitude } = pos.coords
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
        const data = await res.json()
        const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || ""
        if (city) {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/market/location`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ location: city })
          })
          setUserLocation(city)
          setLocationInput(city)
          fetchVehicles()
        }
      } catch {}
    }, () => {})
  }

  const saveLocation = async () => {
    if (!locationInput.trim()) return
    setSavingLocation(true)
    try {
      const token = localStorage.getItem("token")
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/market/location`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ location: locationInput.trim() })
      })
      setUserLocation(locationInput.trim())
      setShowLocationEdit(false)
      setLocationSuggestions([])
      fetchVehicles()
    } catch {}
    finally { setSavingLocation(false) }
  }

  const fetchListingLocationSuggestions = async (query: string) => {
    if (query.length < 2) { setListingLocationSuggestions([]); return }
    setFetchingListingSuggestions(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=in`)
      const data = await res.json()
      const suggestions = data.map((item: any) => {
        const addr = item.address
        return addr.city || addr.town || addr.village || addr.county || item.display_name.split(",")[0]
      }).filter((v: string, i: number, a: string[]) => v && a.indexOf(v) === i)
      setListingLocationSuggestions(suggestions)
    } catch {}
    finally { setFetchingListingSuggestions(false) }
  }

  const fetchLocationSuggestions = async (query: string) => {
    if (query.length < 2) { setLocationSuggestions([]); return }
    setFetchingSuggestions(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=in`)
      const data = await res.json()
      const suggestions = data.map((item: any) => {
        const addr = item.address
        return addr.city || addr.town || addr.village || addr.county || item.display_name.split(",")[0]
      }).filter((v: string, i: number, a: string[]) => v && a.indexOf(v) === i)
      setLocationSuggestions(suggestions)
    } catch {}
    finally { setFetchingSuggestions(false) }
  }

  const correctTypo = (q: string) => {
    const corrections: Record<string, string> = {
      'hond': 'honda', 'hundai': 'hyundai', 'hyundai': 'hyundai',
      'maruthi': 'maruti', 'maruth': 'maruti', 'suzkui': 'suzuki',
      'toyota': 'toyota', 'toyoto': 'toyota', 'toyata': 'toyota',
      'mahindra': 'mahindra', 'mahendra': 'mahindra',
      'bajaj': 'bajaj', 'bajj': 'bajaj',
      'yamha': 'yamaha', 'yamaha': 'yamaha',
      'hiro': 'hero', 'hero honda': 'hero',
      'tvsmotor': 'tvs', 'fordd': 'ford',
      'volkswagan': 'volkswagen', 'volkswagun': 'volkswagen',
    }
    const lower = q.toLowerCase().trim()
    return corrections[lower] || q
  }

  const buildParams = (pg = 1) => {
    const params = new URLSearchParams()
    if (search) params.set('q', correctTypo(search))
    if (filterType) params.set('vehicle_type', filterType)
    if (filterFuel) params.set('fuel_type', filterFuel)
    if (filterMinPrice) params.set('min_price', filterMinPrice)
    if (filterMaxPrice) params.set('max_price', filterMaxPrice)
    if (filterYear) params.set('year', filterYear)
    if (sortBy !== 'latest') params.set('sort', sortBy)
    params.set('page', pg.toString())
    params.set('limit', '20')
    return params.toString()
  }

  const fetchVehicles = async (pg = 1) => {
    try {
      const token = localStorage.getItem('token')
      const headers: any = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/market?${buildParams(pg)}`, { headers })
      const data = await res.json()
      if (pg === 1) {
        setVehicles(data.vehicles || [])
      } else {
        setVehicles(prev => [...prev, ...(data.vehicles || [])])
      }
      setTotal(data.total || 0)
      setPage(pg)
    } catch {}
    finally { setLoading(false); setLoadingMore(false) }
  }

  const loadMore = async () => {
    setLoadingMore(true)
    await fetchVehicles(page + 1)
  }

  const fetchCount = async () => {
    const token = localStorage.getItem("token")
    if (!token) return
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/market/my-count`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setListingCount(data.count || 0)
    } catch {}
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setFormError("Image must be under 5MB"); return }
    if (form.images.length >= 10) { setFormError("Maximum 10 images"); return }
    setUploadingImage(true)
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(",")[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const fd = new FormData()
      fd.append("image", base64)
      fd.append("key", IMGBB_KEY)
      const res = await fetch("https://api.imgbb.com/1/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (data.success) setForm(f => ({ ...f, images: [...f.images, data.data.url] }))
      else setFormError("Upload failed")
    } catch { setFormError("Upload failed") }
    finally { setUploadingImage(false) }
  }

  const submitVehicle = async () => {
    if (!form.title.trim()) { setFormError("Title is required"); return }
    if (!form.make.trim()) { setFormError("Make is required"); return }
    if (!form.model.trim()) { setFormError("Model is required"); return }
    if (!form.year.trim()) { setFormError("Year is required"); return }
    if (!form.price) { setFormError("Price is required"); return }
    if (!form.condition) { setFormError("Condition is required"); return }
    setFormError(""); setSubmitting(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/market`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, price: Number(form.price), km_driven: form.km_driven ? Number(form.km_driven) : null, video_url: form.video_url || null })
      })
      if (res.status === 402) { setShowForm(false); setShowPaymentModal(true); return }
      if (res.ok) {
        setForm({ title: "", vehicle_type: "", make: "", model: "", year: "", variant: "", fuel_type: "", transmission: "", km_driven: "", color: "", condition: "", price: "", location: "", description: "", images: [], video_url: "", noc_available: "", engine: "", owners: "", registration_year: "", rto_state: "", mileage: "" })
        setShowForm(false)
        setListingCount(c => (c || 0) + 1)
        fetchVehicles()
      }
    } catch {}
    finally { setSubmitting(false) }
  }

  const filtered = vehicles

  // Refetch when filters/sort/search change
  useEffect(() => {
    if (!loading) {
      setLoading(true)
      fetchVehicles(1)
    }
  }, [search, filterType, filterFuel, filterMinPrice, filterMaxPrice, filterYear, sortBy])

  const activeFilters = [filterType, filterFuel, filterMinPrice, filterMaxPrice, filterYear].filter(Boolean).length

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="w-full px-4 sm:px-6 lg:px-10 py-8 flex-1">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vehicle Market</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-gray-400">{vehicles.length} vehicles listed</p>
              {currentUser && !locationLoading && (
                <button onClick={() => setShowLocationEdit(true)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                  <MapPin className="w-3 h-3" />
                  {userLocation ? userLocation : "Set location"}
                </button>
              )}
            </div>
          </div>
          <div className="flex items-start gap-2">
            {currentUser && (
              <a href="/market/my-listings" className="px-4 py-2.5 border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-xl transition-all">
                My Listings
              </a>
            )}
            <div className="flex flex-col items-center gap-0.5">
              <button
                onClick={() => { if (!currentUser) { router.push("/login"); return } setShowForm(true) }}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" /> List Vehicle
              </button>
              {listingCount !== null && (
                <p className="text-[10px] text-gray-400">
                  {listingCount < 1 ? "1 free listing" : "₹99 per listing"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by make, model, title..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <button onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors ${showFilters || activeFilters > 0 ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}>
            <SlidersHorizontal className="w-4 h-4" /> Filters
            {activeFilters > 0 && <span className="w-5 h-5 rounded-full bg-white text-gray-900 text-[10px] font-bold flex items-center justify-center">{activeFilters}</span>}
          </button>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 focus:outline-none cursor-pointer">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex flex-wrap gap-4">
            <div className="flex-1 min-w-36">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Vehicle Type</label>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                <option value="">All Types</option>
                {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-36">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Fuel Type</label>
              <select value={filterFuel} onChange={e => setFilterFuel(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                <option value="">All Fuels</option>
                {FUEL_TYPES.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-36">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Min Price (₹)</label>
              <input type="number" value={filterMinPrice} onChange={e => setFilterMinPrice(e.target.value)} placeholder="e.g. 50000"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div className="flex-1 min-w-36">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Max Price (₹)</label>
              <input type="number" value={filterMaxPrice} onChange={e => setFilterMaxPrice(e.target.value)} placeholder="e.g. 500000"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div className="flex-1 min-w-36">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Year</label>
              <input type="number" value={filterYear} onChange={e => setFilterYear(e.target.value)}
                placeholder="e.g. 2019"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            {activeFilters > 0 && (
              <div className="flex items-end">
                <button onClick={() => { setFilterType(""); setFilterFuel(""); setFilterMinPrice(""); setFilterMaxPrice(""); setFilterYear("") }}
                  className="px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg">Clear All</button>
              </div>
            )}
          </div>
        )}

        {/* Listings Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-72 bg-white rounded-2xl border border-gray-200 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-200">
            <Car className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="font-medium text-gray-400">No vehicles found</p>
            <p className="text-sm text-gray-300 mt-1">Be the first to list a vehicle!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {filtered.map(v => (
              <a key={v.id} href={`/market/${v.id}`}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all group">
                {/* Image */}
                <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                  {v.images?.[0]
                    ? <img src={v.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center"><Car className="w-12 h-12 text-gray-300" /></div>}
                  <div className="absolute top-2 left-2">
                    <span className="text-[10px] font-bold bg-white/90 text-gray-700 px-2 py-0.5 rounded-full">{v.vehicle_type || "Vehicle"}</span>
                  </div>
                </div>
                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{v.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{[v.make, v.model, v.year].filter(Boolean).join(" · ")}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {v.fuel_type && <span className="flex items-center gap-1 text-[10px] text-gray-500"><Fuel className="w-3 h-3" />{v.fuel_type}</span>}
                    {v.km_driven && <span className="flex items-center gap-1 text-[10px] text-gray-500"><Gauge className="w-3 h-3" />{v.km_driven.toLocaleString("en-IN")} km</span>}
                    {v.location && <span className="flex items-center gap-1 text-[10px] text-gray-500"><MapPin className="w-3 h-3" />{v.location}</span>}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-bold text-gray-900">₹{v.price?.toLocaleString("en-IN")}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${v.condition === "Excellent" ? "bg-green-50 text-green-600" : v.condition === "Good" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-600"}`}>{v.condition}</span>
                  </div>
                  <p className="text-[10px] text-gray-300 mt-1">{new Date(v.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>

      {/* Location Edit Modal */}
      {showLocationEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowLocationEdit(false); setLocationSuggestions([]) }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-base font-bold text-gray-900 mb-1">Your Location</h3>
            <p className="text-xs text-gray-400 mb-4">Listings near you will appear first</p>
            <div className="relative mb-4">
              <input
                value={locationInput}
                onChange={e => { setLocationInput(e.target.value); fetchLocationSuggestions(e.target.value) }}
                onKeyDown={e => { if (e.key === "Enter") saveLocation() }}
                placeholder="Enter your city"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                autoFocus
              />
              {fetchingSuggestions && <p className="text-xs text-gray-400 mt-1 px-1">Searching...</p>}
              {locationSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                  {locationSuggestions.map((s, i) => (
                    <button key={i} onClick={() => { setLocationInput(s); setLocationSuggestions([]) }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100 last:border-b-0">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />{s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowLocationEdit(false); setLocationSuggestions([]) }} className="flex-1 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50">Cancel</button>
              <button onClick={saveLocation} disabled={savingLocation || !locationInput.trim()}
                className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50">
                {savingLocation ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List Vehicle Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-900">List a Vehicle</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {formError && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl">{formError}</p>}

              {/* Images */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-2 block">Photos (up to 10)</label>
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
                  {form.images.length < 10 && (
                    <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                      <Plus className="w-5 h-5 text-gray-400" />
                      <span className="text-[10px] text-gray-400">{uploadingImage ? "Uploading..." : "Add"}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                    </label>
                  )}
                </div>
              </div>

              {/* Title */}
              <Field label="Listing Title" required>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. 2019 Honda City VX Petrol - Single Owner" className={inp} />
              </Field>

              {/* Vehicle Info */}
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Vehicle Details</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Vehicle Type" required>
                  <select value={form.vehicle_type} onChange={e => setForm(f => ({ ...f, vehicle_type: e.target.value }))} className={sel}>
                    <option value="">Select type</option>
                    {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Make (Brand)" required>
                  <input value={form.make} onChange={e => setForm(f => ({ ...f, make: e.target.value }))} placeholder="e.g. Honda" className={inp} />
                </Field>
                <Field label="Model" required>
                  <input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} placeholder="e.g. City" className={inp} />
                </Field>
                <Field label="Year" required>
                  <input value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} placeholder="e.g. 2019" className={inp} />
                </Field>
                <Field label="Variant / Trim">
                  <input value={form.variant} onChange={e => setForm(f => ({ ...f, variant: e.target.value }))} placeholder="e.g. VX, ZX" className={inp} />
                </Field>
                <Field label="Color">
                  <input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} placeholder="e.g. White" className={inp} />
                </Field>
                <Field label="Fuel Type">
                  <select value={form.fuel_type} onChange={e => setForm(f => ({ ...f, fuel_type: e.target.value }))} className={sel}>
                    <option value="">Select</option>
                    {FUEL_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Transmission">
                  <select value={form.transmission} onChange={e => setForm(f => ({ ...f, transmission: e.target.value }))} className={sel}>
                    <option value="">Select</option>
                    {TRANSMISSION.map(t => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="KMs Driven">
                  <input type="number" value={form.km_driven} onChange={e => setForm(f => ({ ...f, km_driven: e.target.value }))} placeholder="e.g. 45000" className={inp} />
                </Field>
                <Field label="Engine (cc)">
                  <input value={form.engine} onChange={e => setForm(f => ({ ...f, engine: e.target.value }))} placeholder="e.g. 1497cc, 150cc" className={inp} />
                </Field>
                <Field label="Number of Owners">
                  <select value={form.owners} onChange={e => setForm(f => ({ ...f, owners: e.target.value }))} className={sel}>
                    <option value="">Select</option>
                    <option value="1st Owner">1st Owner</option>
                    <option value="2nd Owner">2nd Owner</option>
                    <option value="3rd Owner">3rd Owner</option>
                    <option value="4th Owner or more">4th Owner or more</option>
                  </select>
                </Field>
                <Field label="Registration Year">
                  <input value={form.registration_year} onChange={e => setForm(f => ({ ...f, registration_year: e.target.value }))} placeholder="e.g. 2019" className={inp} />
                </Field>
                <Field label="Mileage (km/l)">
                  <input value={form.mileage} onChange={e => setForm(f => ({ ...f, mileage: e.target.value }))} placeholder="e.g. 45" className={inp} />
                </Field>
                <Field label="RTO / Registration State">
                  <input value={form.rto_state} onChange={e => setForm(f => ({ ...f, rto_state: e.target.value }))} placeholder="e.g. KL, MH, DL" className={inp} />
                </Field>
                <Field label="Condition" required>
                  <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))} className={sel}>
                    <option value="">Select</option>
                    {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </Field>
              </div>

              {/* Price & Location */}
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pt-1">Price & Location</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Price (₹)" required>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="e.g. 450000" className={inp} />
                </Field>
                <Field label="Location">
                  <div className="relative">
                    <input value={form.location}
                      onChange={e => { setForm(f => ({ ...f, location: e.target.value })); fetchListingLocationSuggestions(e.target.value) }}
                      placeholder="City, State" className={inp} />
                    {fetchingListingSuggestions && <p className="text-xs text-gray-400 mt-1">Searching...</p>}
                    {listingLocationSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                        {listingLocationSuggestions.map((s, i) => (
                          <button key={i} type="button" onClick={() => { setForm(f => ({ ...f, location: s })); setListingLocationSuggestions([]) }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100 last:border-b-0">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />{s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </Field>
              </div>
              <Field label="Description">
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                  placeholder="Describe the vehicle — service history, modifications, reason for selling..." className={inp + " resize-none"} />
              </Field>
              <Field label="Video Link (optional)">
                <input value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))}
                  placeholder="Paste YouTube or Google Drive video link" className={inp} />
              </Field>
              <Field label="NOC Available">
                <div className="flex gap-3">
                  {["Yes", "No"].map(opt => (
                    <button key={opt} type="button"
                      onClick={() => setForm(f => ({ ...f, noc_available: opt }))}
                      className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-colors ${form.noc_available === opt ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-3 border border-gray-200 text-sm text-gray-600 font-medium rounded-xl hover:bg-gray-50">Cancel</button>
                <button onClick={submitVehicle} disabled={submitting} className="flex-1 py-3 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50">
                  {submitting ? "Publishing..." : "Publish Listing"}
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
              <Car className="w-7 h-7 text-gray-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Free listing used</h3>
            <p className="text-sm text-gray-500 mb-5">Each additional listing costs <span className="font-bold text-gray-900">₹99</span>.</p>
            <button onClick={() => { setShowPaymentModal(false); alert("Payment coming soon!") }}
              className="w-full py-3 bg-gray-900 hover:bg-gray-700 text-white font-semibold rounded-xl mb-3">Pay ₹99 & List Vehicle</button>
            <button onClick={() => setShowPaymentModal(false)} className="w-full py-2.5 border border-gray-200 text-sm text-gray-600 rounded-xl hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MarketPage() {
  return (
    <Suspense fallback={null}>
      <MarketPageInner />
    </Suspense>
  )
}