"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Mic, Bike, Car, Truck, Star, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const vehicleTypes = [
  { id: "two-wheeler", label: "Two Wheeler", icon: Bike },
  { id: "four-wheeler", label: "Four Wheeler", icon: Car },
  { id: "commercial", label: "Commercial", icon: Truck },
  { id: "vintage", label: "Vintage", icon: Car },
]

const CONDITION_KEY = "partly_preferred_condition"

const conditionOptions = [
  { value: "new", label: "New" },
  { value: "used", label: "Used" },
  { value: "all", label: "All" },
] as const

type Condition = "new" | "used" | "all"

export function HeroSearch() {
  const [selectedType, setSelectedType] = useState("")
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [condition, setCondition] = useState<Condition>("new")
  const [starredCondition, setStarredCondition] = useState<Condition | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // On mount: load starred preference and apply as initial default only
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CONDITION_KEY) as Condition | null
      if (saved) {
        setStarredCondition(saved)
        setCondition(saved)   // sets the initial default when page first loads
      }
    } catch {}
  }, [])

  // Star = save/remove preference for next session only. Never touches active condition.
  const handleStarCondition = (c: Condition) => {
    if (starredCondition === c) {
      setStarredCondition(null)
      try { localStorage.removeItem(CONDITION_KEY) } catch {}
    } else {
      setStarredCondition(c)
      try { localStorage.setItem(CONDITION_KEY, c) } catch {}
      // Do NOT call setCondition here — user's current selection stays unchanged
    }
  }

  // Fetch suggestions as user types
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([])
      return
    }

    const timer = setTimeout(async () => {
      const q = searchQuery.trim()
      const { data } = await supabase
        .from("products")
        .select("name, brand, category, keywords")
        .eq("status", "Published")
        .or(`name.ilike.%${q}%,brand.ilike.%${q}%,category.ilike.%${q}%,keywords.ilike.%${q}%`)
        .limit(5)

      if (data) {
        const results = [
          ...new Set(
            data.flatMap((p) =>
              [p.name, p.brand, p.category, ...(p.keywords ? p.keywords.split(",").map((k: string) => k.trim()) : [])].filter(
                (val) => val && val.toLowerCase().includes(q.toLowerCase())
              )
            )
          ),
        ].slice(0, 5)
        setSuggestions(results)
        setShowSuggestions(results.length > 0)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setError("Type something to search")
      inputRef.current?.focus()
      return
    }
    setError("")
    setShowSuggestions(false)
    const params = new URLSearchParams({ q: searchQuery.trim() })
    if (condition !== "all") params.set("condition", condition)
    router.push(`/search?${params.toString()}`)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
    setError("")
    const params = new URLSearchParams({ q: suggestion })
    if (condition !== "all") params.set("condition", condition)
    router.push(`/search?${params.toString()}`)
  }

  return (
    <section className="py-12 md:py-20 px-4 bg-white">
      <div className="container mx-auto max-w-4xl">

        {/* Heading */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Find New & Used Parts
            <span className="block text-blue-600">Across All India</span>
          </h1>
        </div>

        {/* Vehicle Type Tabs */}
        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          {vehicleTypes.map((type) => {
            const Icon = type.icon
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all
                  ${selectedType === type.id
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-200"
                  }`}
              >
                <Icon className="h-4 w-4" />
                {type.label}
              </button>
            )
          })}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className={`bg-white rounded-2xl shadow-lg border p-2 transition-colors ${error ? "border-red-300" : "border-gray-200"}`}>
            <div className="flex items-center">

              {/* Condition Dropdown */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="py-3 px-4 flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors border-r border-gray-200 rounded-l-2xl"
                >
                  {conditionOptions.find(o => o.value === condition)?.label}
                  <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>
              </div>

              {/* Search Input */}
              <div className="flex-1 flex items-center gap-3 px-4">
                <Search className={`h-4 w-4 shrink-0 ${error ? "text-red-400" : "text-gray-400"}`} />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={error || "Search by part name or number..."}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    if (error) setError("")
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  className={`w-full py-3 bg-transparent focus:outline-none text-sm text-gray-900 ${
                    error ? "placeholder:text-red-400" : "placeholder:text-gray-400"
                  }`}
                />
              </div>

              {/* Mic */}
              <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                <Mic className="h-4 w-4" />
              </button>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                className="py-3 px-7 bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors rounded-r-2xl flex-shrink-0"
              >
                Search
              </button>
            </div>
          </div>

          {/* Condition dropdown — rendered outside the search bar box to avoid clipping */}
          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute top-full left-0 mt-2 w-36 bg-white rounded-xl border border-gray-100 shadow-xl z-50 py-1.5">
                {conditionOptions.map((opt) => (
                  <div key={opt.value} className="flex items-center px-3 gap-1">
                    <button
                      onClick={() => { setCondition(opt.value); setDropdownOpen(false) }}
                      className={`flex-1 text-left py-2 text-sm transition-colors font-medium ${
                        condition === opt.value
                          ? "text-blue-600 font-semibold"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {opt.label}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStarCondition(opt.value) }}
                      title={starredCondition === opt.value ? "Remove default" : "Set as default"}
                      className="p-1 transition-colors flex-shrink-0"
                    >
                      <Star
                        className={`h-3.5 w-3.5 transition-all ${
                          starredCondition === opt.value
                            ? "fill-blue-500 text-blue-500"
                            : "text-gray-300 hover:text-blue-400"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Suggestions dropdown */}
          {showSuggestions && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowSuggestions(false)} />
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-100 shadow-xl z-40 py-2 overflow-hidden">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(s)}
                    className="w-full text-left px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <Search className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Preference hint */}


      </div>
    </section>
  )
}