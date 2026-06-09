"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { X, Search, Mic, SlidersHorizontal, ChevronDown, List, LayoutGrid, Star, Heart, Package, MapPin, ShoppingCart, CircleUserRound, Menu, Check } from "lucide-react"
import { LoginModal } from "@/components/login-modal"
import { Header } from "@/components/header"
import { mapDbToProduct } from "@/lib/supabase"

type Product = ReturnType<typeof mapDbToProduct>

const INDIA_DATA: Record<string, string[]> = {
  "Andhra Pradesh": ["Alluri Sitharama Raju", "Anakapalli", "Anantapur", "Annamayya", "Bapatla", "Chittoor", "East Godavari", "Eluru", "Guntur", "Kadapa", "Kakinada", "Konaseema", "Krishna", "Kurnool", "Nandyal", "Nellore", "NTR", "Palnadu", "Prakasam", "Sri Sathya Sai", "Srikakulam", "Tirupati", "Visakhapatnam", "Vizianagaram", "West Godavari"],
  "Arunachal Pradesh": ["Tawang", "West Kameng", "East Kameng", "Papum Pare", "Kurung Kumey", "Kra Daadi", "Lower Subansiri", "Upper Subansiri", "West Siang", "East Siang", "Siang", "Upper Siang", "Lower Siang", "Lower Dibang Valley", "Dibang Valley", "Anjaw", "Lohit", "Namsai", "Changlang", "Tirap", "Longding"],
  "Assam": ["Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup", "Kamrup Metropolitan", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "South Salmara-Mankachar", "Tinsukia", "Udalguri", "West Karbi Anglong"],
  "Bihar": ["Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"],
  "Chhattisgarh": ["Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada", "Dhamtari", "Durg", "Gariaband", "Janjgir-Champa", "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", "Korea", "Mahasamund", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sukma", "Surajpur", "Surguja"],
  "Goa": ["North Goa", "South Goa"],
  "Gujarat": ["Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod", "Dang", "Devbhoomi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad"],
  "Haryana": ["Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurgaon", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"],
  "Himachal Pradesh": ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur", "Solan", "Una"],
  "Jharkhand": ["Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahebganj", "Seraikela Kharsawan", "Simdega", "West Singhbhum"],
  "Karnataka": ["Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir"],
  "Kerala": ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"],
  "Maharashtra": ["Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli", "Tirunelveli", "Erode", "Vellore", "Thoothukudi"],
  "Uttar Pradesh": ["Lucknow", "Kanpur Nagar", "Varanasi", "Agra", "Prayagraj", "Ghaziabad", "Meerut", "Noida", "Bareilly"],
  "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Siliguri", "Murshidabad", "Malda"],
  "Delhi (UT)": ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"],
  "Jammu & Kashmir (UT)": ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Kupwara"],
  "Ladakh (UT)": ["Leh", "Kargil"],
  "Lakshadweep (UT)": ["Lakshadweep"],
  "Puducherry (UT)": ["Puducherry", "Karaikal", "Mahe", "Yanam"],
  "Chandigarh (UT)": ["Chandigarh"],
  "Andaman & Nicobar Islands (UT)": ["Nicobar", "North and Middle Andaman", "South Andaman"],
}

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
]


function SearchPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get("q") || ""
  const initialCondition = (searchParams.get("condition") as "new" | "used" | "all") || "all"

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState<"all" | "new" | "used">(initialCondition)

  // Sync category state when URL condition param changes
  useEffect(() => {
    setCategory(initialCondition)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCondition])
  const [sortBy, setSortBy] = useState("relevance")
  const [locationFilterOn, setLocationFilterOn] = useState(() => {
    try { return localStorage.getItem("partly_nearby_first") === "true" } catch { return false }
  })
  const [locationSaved, setLocationSaved] = useState(false)
  const [filterState, setFilterState] = useState(() => {
    try { return localStorage.getItem("partly_filter_state") || "" } catch { return "" }
  })
  const [filterDistrict, setFilterDistrict] = useState(() => {
    try { return localStorage.getItem("partly_filter_district") || "" } catch { return "" }
  })
  const [filterPincode, setFilterPincode] = useState(() => {
    try { return localStorage.getItem("partly_filter_pincode") || "" } catch { return "" }
  })
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [priceRange, setPriceRange] = useState([0, 100000])
  const [minInput, setMinInput] = useState("")
  const [maxInput, setMaxInput] = useState("")
  const [filterBrand, setFilterBrand] = useState("")
  const [filterMake, setFilterMake] = useState("")
  const [filterModel, setFilterModel] = useState("")
  const [filterYear, setFilterYear] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [wishlist, setWishlist] = useState<Set<string>>(new Set())

  // Load wishlist
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

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label || "Relevance"

  /* ── Fetch products from Supabase ── */
  useEffect(() => {
    if (initialQuery.trim()) {
      fetchProducts(initialQuery.trim(), category)
    } else {
      setProducts([])
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery, category, locationFilterOn, filterState, filterPincode, filterMake, filterModel, filterYear])

  async function fetchProducts(q = initialQuery.trim(), condition = category) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ q, page: '1', limit: '48' })
      if (condition === 'new') params.set('condition', 'new')
      else if (condition === 'used') params.set('condition', 'used')

      // Vehicle filters
      if (filterMake)  params.set('filterMake', filterMake)
      if (filterModel) params.set('filterModel', filterModel)
      if (filterYear)  params.set('filterYear', filterYear)

      // Nearby First: pass location params for ranking
      if (locationFilterOn) {
        params.set('nearbyFirst', 'true')
        if (filterState) params.set('state', filterState)
        if (filterPincode) params.set('pincode', filterPincode)
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/search?${params.toString()}`)
      const json = await res.json()
      const products = (json.products || []).map((p: any) => {
        if (p.isIndividualListing) return { ...p, name: p.name || p.title }
        return mapDbToProduct(p)
      })

      // Score: products matching more words rank higher
      const words = q.split(/\s+/).filter(Boolean)
      const scored = products.map((p: any) => {
        const haystack = [p.name, p.brand, p.category, (p as any).description, (p as any).keywords,
          (p as any).vehicle_make, (p as any).vehicle_model].join(' ').toLowerCase()
        const score = words.reduce((acc: number, w: string) => acc + (haystack.includes(w.toLowerCase()) ? 1 : 0), 0)
        return { product: p, score }
      })
      scored.sort((a: any, b: any) => b.score - a.score)
      setProducts(scored.map((s: any) => s.product))
    } catch {}
    setLoading(false)
  }

  const saveSearch = (q: string, cond: string | null) => {
    try {
      const token = localStorage.getItem("token")
      if (token) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/activity/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ query: q, condition: cond })
        })
      }
    } catch {}
  }


  /* ── Filter + Sort on client side ── */
  let filtered = products.filter((p) => {
    if (category === "new") return (p as any).partType === "new" || p.condition === "new"
    if (category === "used") return (p as any).partType === "used"
    return true
  }).filter((p) => {
    return p.price >= priceRange[0] && p.price <= priceRange[1]
  })

  if (sortBy === "price-low") filtered = [...filtered].sort((a, b) => a.price - b.price)
  if (sortBy === "price-high") filtered = [...filtered].sort((a, b) => b.price - a.price)
  if (sortBy === "newest") filtered = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  // Location-based sorting: same district first, then same state, then rest
  if (locationFilterOn && (filterDistrict || filterState)) {
    filtered = [...filtered].sort((a, b) => {
      const scoreA = ((a as any).district?.toLowerCase() === filterDistrict.toLowerCase() && filterDistrict ? 2 : 0) + ((a as any).state?.toLowerCase() === filterState.toLowerCase() && filterState ? 1 : 0)
      const scoreB = ((b as any).district?.toLowerCase() === filterDistrict.toLowerCase() && filterDistrict ? 2 : 0) + ((b as any).state?.toLowerCase() === filterState.toLowerCase() && filterState ? 1 : 0)
      return scoreB - scoreA
    })
  }

  const stockStatus = (stock: number, minStock: number) => {
    if (stock === 0) return "out-of-stock"
    if (stock <= (minStock || 3)) return "low-stock"
    return "in-stock"
  }

  const stockColor = (status: string) => {
    if (status === "in-stock") return "text-green-600"
    if (status === "low-stock") return "text-yellow-600"
    return "text-red-600"
  }

  const stockLabel = (status: string) => {
    if (status === "in-stock") return "In stock"
    if (status === "low-stock") return "Low stock"
    return "Out of stock"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-5 rounded-xl mb-6 sticky top-16 z-30 bg-white/80 backdrop-blur-md border border-gray-200 shadow-sm">

          {/* Left — Filter + Sort */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${showFilters ? "text-blue-600" : "text-gray-700"}`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filter
            </button>
            <div className="h-4 w-px bg-gray-200" />
            <div className="relative flex items-center gap-1.5">
              <span className="text-sm font-medium text-gray-700">Sort by</span>
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-1 text-sm text-gray-700 hover:text-blue-600"
              >
                {currentSortLabel}
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
              {showSortMenu && (
                <div className="absolute top-8 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-44">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortBy(opt.value); setShowSortMenu(false) }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${sortBy === opt.value ? "text-blue-600 font-medium" : "text-gray-700"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right — View */}
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-600 mr-2">View as</span>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded transition-colors ${viewMode === "list" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:text-gray-700"}`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded transition-colors ${viewMode === "grid" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:text-gray-700"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-6">

          {/* Filter Sidebar */}
          {showFilters && (
            <div className="hidden lg:block w-64 flex-shrink-0">
              <div className="w-64 bg-white rounded-xl border border-gray-200 p-4 sticky top-28">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                <button onClick={() => setShowFilters(false)}>
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>

              {/* Location Filter */}
              <div className="border-b border-gray-100 pb-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900">Nearby First</h4>
                  <button
                    onClick={() => {
                      const next = !locationFilterOn
                      setLocationFilterOn(next)
                      try { localStorage.setItem("partly_nearby_first", String(next)) } catch {}
                    }}
                    className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${locationFilterOn ? "bg-blue-600" : "bg-gray-200"}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${locationFilterOn ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                </div>
                {locationFilterOn && (
                  <div className="space-y-2">
                    {/* State */}
                    <select
                      value={filterState}
                      onChange={(e) => { setFilterState(e.target.value); setFilterDistrict(""); setLocationSaved(false) }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700">
                      <option value="">Select State / UT</option>
                      {Object.keys(INDIA_DATA).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {/* District — only shown after state selected */}
                    {filterState && (
                      <select
                        value={filterDistrict}
                        onChange={(e) => { setFilterDistrict(e.target.value); setLocationSaved(false) }}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700">
                        <option value="">Select District</option>
                        {(INDIA_DATA[filterState] || []).map((d: string) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    )}
                    {/* Pincode */}
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Pincode (optional)"
                      value={filterPincode}
                      onChange={(e) => { setFilterPincode(e.target.value.replace(/\D/g, "")); setLocationSaved(false) }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {/* Save button */}
                    <button
                      onClick={() => {
                        try {
                          localStorage.setItem("partly_filter_state", filterState)
                          localStorage.setItem("partly_filter_district", filterDistrict)
                          localStorage.setItem("partly_filter_pincode", filterPincode)
                          setLocationSaved(true)
                          setTimeout(() => setLocationSaved(false), 2000)
                        } catch {}
                      }}
                      className={`w-full text-xs font-medium py-1.5 rounded-lg border transition-all duration-300 ${
                        locationSaved
                          ? "bg-green-500 border-green-500 text-white"
                          : "text-blue-600 border-blue-200 hover:bg-blue-50"
                      }`}>
                      {locationSaved ? "✓ Location Saved!" : "Save location for later"}
                    </button>
                  </div>
                )}
              </div>

              {/* Price Range Slider */}
              <div className="border-b border-gray-100 pb-4 mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Price Range</h4>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">₹{priceRange[0].toLocaleString("en-IN")}</span>
                  <span className="text-xs font-medium text-gray-600">₹{priceRange[1].toLocaleString("en-IN")}</span>
                </div>
                <div className="relative pt-1">
                  <input
                    type="range"
                    min={0}
                    max={100000}
                    step={500}
                    value={priceRange[0]}
                    onChange={e => {
                      const val = Number(e.target.value)
                      if (val < priceRange[1]) setPriceRange([val, priceRange[1]])
                    }}
                    className="w-full h-1.5 appearance-none rounded-full bg-gray-200 accent-blue-600 cursor-pointer mb-2"
                  />
                  <input
                    type="range"
                    min={0}
                    max={100000}
                    step={500}
                    value={priceRange[1]}
                    onChange={e => {
                      const val = Number(e.target.value)
                      if (val > priceRange[0]) setPriceRange([priceRange[0], val])
                    }}
                    className="w-full h-1.5 appearance-none rounded-full bg-gray-200 accent-blue-600 cursor-pointer"
                  />
                </div>
                {(priceRange[0] > 0 || priceRange[1] < 100000) && (
                  <button onClick={() => setPriceRange([0, 100000])}
                    className="text-xs text-red-500 hover:underline mt-2">Reset</button>
                )}
              </div>

              {/* Brand — dynamic from products */}
              <div className="border-b border-gray-100 pb-4 mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Brand</h4>
                {[...new Set(products.map(p => p.brand).filter(Boolean))].slice(0, 6).map((brand) => (
                  <label key={brand} className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input type="checkbox" checked={filterBrand === brand} onChange={() => setFilterBrand(filterBrand === brand ? "" : brand)} className="rounded border-gray-300 text-blue-600" />
                    <span className="text-sm text-gray-600">{brand}</span>
                  </label>
                ))}
                {filterBrand && <button onClick={() => setFilterBrand("")} className="text-xs text-red-500 hover:underline mt-1">Clear</button>}
              </div>

              {/* Vehicle — Make/Model/Year dropdowns */}
              <div className="border-b border-gray-100 pb-4 mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Vehicle</h4>

                {/* Make */}
                <select
                  value={filterMake}
                  onChange={(e) => { setFilterMake(e.target.value); setFilterModel(""); setFilterYear("") }}
                  className="w-full mb-2 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="">All Makes</option>
                  {[...new Set(products.map(p => (p as any).vehicle_make).filter(Boolean))].sort().map((make: string) => (
                    <option key={make} value={make}>{make}</option>
                  ))}
                </select>

                {/* Model — only show if Make selected */}
                {filterMake && (
                  <select
                    value={filterModel}
                    onChange={(e) => { setFilterModel(e.target.value); setFilterYear("") }}
                    className="w-full mb-2 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="">All Models</option>
                    {[...new Set(products
                      .filter(p => (p as any).vehicle_make === filterMake)
                      .map(p => (p as any).vehicle_model)
                      .filter(Boolean))].sort().map((model: string) => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                )}

                {/* Year — only show if Model selected */}
                {filterModel && (
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="">Any Year</option>
                    {Array.from({ length: 25 }, (_, i) => new Date().getFullYear() - i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                )}

                {(filterMake || filterModel || filterYear) && (
                  <button
                    onClick={() => { setFilterMake(""); setFilterModel(""); setFilterYear("") }}
                    className="text-xs text-red-500 hover:underline mt-2"
                  >
                    Clear vehicle filter
                  </button>
                )}
              </div>

              {/* Category — dynamic */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Category</h4>
                {[...new Set(products.map(p => p.category).filter(Boolean))].slice(0, 6).map((cat) => (
                  <label key={cat} className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                    <span className="text-sm text-gray-600">{cat}</span>
                  </label>
                ))}
              </div>
              </div>
            </div>
          )}

          {/* Product Grid/List */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg mb-4 animate-pulse" />
                    <div className="h-3 w-20 bg-gray-100 rounded mb-2" />
                    <div className="h-4 w-full bg-gray-100 rounded mb-2" />
                    <div className="h-4 w-24 bg-gray-100 rounded mb-3" />
                    <div className="h-8 w-full bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <Package className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                {initialQuery.trim() ? (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No results found</h3>
                    <p className="text-sm text-gray-500">No products match &ldquo;{initialQuery}&rdquo;. Try a different keyword.</p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Search for parts</h3>
                    <p className="text-sm text-gray-500">Use the search bar above to find parts by name, brand, or vehicle.</p>
                  </>
                )}
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">{filtered.length} result{filtered.length !== 1 ? "s" : ""} found{initialQuery ? ` for "${initialQuery}"` : ""}</p>

                <div className={viewMode === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                  : "flex flex-col gap-4"
                }>
                  {filtered.map((product) => {
                    const productImages = [product.image, ...(product.images || [])].filter(Boolean)
                    const discount = product.discountPercent || (product.originalPrice && product.price ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0)
                    const stock = stockStatus(product.stock, product.minStock)
                    const vehicle = [product.vehicle_make, product.vehicle_model, product.vehicle_year].filter(Boolean).join(" ")

                    return viewMode === "grid" ? (
                      <a key={product.id} href={(product as any).isIndividualListing ? `/individual-listing/${product.id}` : `/product/${product.id}`} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-[#2874f0]/30 transition-all group block">
                        {/* Image */}
                        <div className="relative aspect-square overflow-hidden bg-white">
                          {productImages.length > 0 ? (
                            <img src={productImages[0]} alt={product.name} className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300 mix-blend-multiply" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Package className="h-10 w-10 text-gray-200" /></div>
                          )}
                          <button
                            onClick={(e) => toggleWishlist(e, product)}
                            className="absolute top-2 right-2 p-1 transition-colors"
                          >
                            <Heart className={`h-3.5 w-3.5 ${wishlist.has(product.id) ? ((((product)?.partType === "used") || ["used", "Used - Like New", "Used - Good", "Used - Fair", "Refurbished"].includes((product)?.condition as string)) ? "fill-orange-500 text-orange-500" : "fill-blue-500 text-blue-500") : ((((product)?.partType === "used") || ["used", "Used - Like New", "Used - Good", "Used - Fair", "Refurbished"].includes((product)?.condition as string)) ? "text-orange-400" : "text-blue-400")}`} />
                          </button>
                          {/* Tags */}
                          <div className="absolute top-2 left-2 flex flex-wrap gap-1">

                            {product.flairTag && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-sm bg-gray-900 text-white">
                                {product.flairTag}
                              </span>
                            )}
                            {discount > 0 && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-sm bg-yellow-400 text-yellow-900">
                                {discount}% OFF
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="p-3">
                          <p className="text-[10px] text-gray-400 mb-0.5 truncate">{product.brand}</p>
                          <h3 className="text-xs font-semibold text-gray-900 line-clamp-2 leading-snug mb-1 group-hover:text-[#2874f0] transition-colors">{product.name}</h3>
                          {vehicle && <p className="text-[10px] text-gray-400 mb-1 truncate">{vehicle}</p>}

                          <div className="flex items-baseline gap-1.5 mt-1.5">
                            <span className="text-sm font-bold text-gray-900">₹{product.price?.toLocaleString("en-IN")}</span>
                            {product.originalPrice > product.price && (
                              <span className="text-[10px] text-gray-400 line-through">₹{product.originalPrice?.toLocaleString("en-IN")}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 mt-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${stock === "in-stock" ? "bg-green-500" : stock === "low-stock" ? "bg-yellow-500" : "bg-red-500"}`} />
                            <span className={`text-[10px] ${stockColor(stock)}`}>{stockLabel(stock)}</span>
                          </div>
                        </div>
                      </a>
                    ) : (
                      <a key={product.id} href={(product as any).isIndividualListing ? `/individual-listing/${product.id}` : `/product/${product.id}`} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow block">
                        <div className="flex gap-6">
                          {/* Image */}
                          <div className="relative w-48 flex-shrink-0">
                            <div className="aspect-[4/3] rounded-lg overflow-hidden bg-white">
                              {productImages.length > 0 ? (
                                <img src={productImages[0]} alt={product.name} className="w-full h-full object-contain p-2 mix-blend-multiply" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><Package className="h-10 w-10 text-gray-200" /></div>
                              )}
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1">
                            <p className="text-sm text-gray-400 mb-1">{product.brand}</p>
                            <h3 className="text-base font-semibold text-gray-900 mb-1 hover:text-blue-600 transition-colors">{product.name}</h3>
                            {vehicle && <p className="text-sm text-gray-400 mb-2">{vehicle}</p>}

                            <div className="flex items-baseline gap-2 mb-2">
                              <span className="text-xl font-bold text-gray-900">₹{product.price?.toLocaleString("en-IN")}</span>
                              {product.originalPrice > product.price && (
                                <span className="text-sm text-gray-400 line-through">₹{product.originalPrice?.toLocaleString("en-IN")}</span>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-1 mb-2">

                              {product.flairTag && (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-sm bg-gray-900 text-white">
                                  {product.flairTag}
                                </span>
                              )}
                              {discount > 0 && (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-sm bg-yellow-400 text-yellow-900">
                                  {discount}% OFF
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${stock === "in-stock" ? "bg-green-500" : stock === "low-stock" ? "bg-yellow-500" : "bg-red-500"}`} />
                              <span className={`text-sm ${stockColor(stock)}`}>{stockLabel(stock)}</span>
                            </div>

                            {product.location && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                                <MapPin className="h-3 w-3" /> {product.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </a>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SearchPageInner />
    </Suspense>
  )
}