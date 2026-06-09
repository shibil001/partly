"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Eye, EyeOff, AlertTriangle, Loader2, ChevronLeft } from "lucide-react"

export default function SellerLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(
    searchParams.get("reason") === "session_expired"
      ? "Your session expired. Please log in again."
      : ""
  )
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const user = JSON.parse(localStorage.getItem("seller_user") || "{}")
      const token = localStorage.getItem("seller_token")
      if (token && user?.role === "seller") {
        try {
          const shop = JSON.parse(localStorage.getItem("seller_shop") || "{}")
          const isUsed = shop?.product_condition === "used"
          router.replace(isUsed ? "/seller/used-dashboard" : "/seller/dashboard")
        } catch {
          router.replace("/seller/dashboard")
        }
      }
    } catch {}
  }, [])

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Please enter your email and password")
      return
    }
    setLoading(true)
    setError("")

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Invalid email or password")
        setLoading(false)
        return
      }

      if (data.user?.role !== "seller") {
        setError("Access denied. This portal is for sellers only.")
        setLoading(false)
        return
      }

      localStorage.setItem("seller_token", data.token)
      if (data.refresh_token) localStorage.setItem("seller_refresh_token", data.refresh_token)
      localStorage.setItem("seller_user", JSON.stringify(data.user))
      if (data.shop) localStorage.setItem("seller_shop", JSON.stringify(data.shop))
      sessionStorage.removeItem("seller_orders_tab")

      // Redirect to correct dashboard based on shop type
      const isUsed = data.shop?.product_condition === "used"
      router.push(isUsed ? "/seller/used-dashboard" : "/seller/dashboard")
    } catch {
      setError("Cannot connect to server. Make sure the backend is running.")
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin()
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">

      {/* Background Image */}
      <Image
        src="/images/bg.png"
        alt="Background"
        fill
        className="object-cover"
        priority
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-[750px] bg-white shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[480px]">

        {/* Left Panel */}
        <div className="bg-[#2874f0] text-white p-10 md:w-[40%] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-white font-bold text-lg tracking-tight">PARTLY</span>
            </div>
            <h1 className="text-[26px] font-bold mb-4 leading-tight">Welcome back</h1>
            <p className="text-[15px] leading-relaxed text-white/85">
              Sign in to manage your shop, track orders, and grow your vehicle parts business
            </p>
          </div>
          <div className="mt-auto flex justify-center pb-2">
            <div className="relative w-[200px] h-[140px]">
              <div className="absolute top-0 right-8">
                <div className="w-12 h-8 bg-[#4285f4]/60 rounded-full relative">
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full" />
                </div>
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
                <div className="w-28 h-20 bg-[#5c9eff] rounded-t-lg border-4 border-[#4a8be8] flex items-center justify-center">
                  <div className="w-10 h-10 bg-[#4285f4] rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                </div>
                <div className="w-32 h-2 bg-[#4a8be8] rounded-b-sm mx-auto" />
              </div>
              <div className="absolute bottom-2 left-2">
                <div className="w-8 h-10 bg-red-400 rounded-sm relative">
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
                </div>
              </div>
              <div className="absolute bottom-4 right-4 w-6 h-8 bg-yellow-300 rounded-sm transform rotate-12" />
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="p-10 md:w-[60%] flex flex-col justify-center">
          <Link
            href="/seller"
            className="flex items-center gap-1 text-sm text-slate-400 hover:text-[#2874f0] transition-colors mb-6 -mt-2 w-fit"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Link>

          <h2 className="text-[20px] font-semibold text-slate-800 mb-1">Seller Login</h2>
          <p className="text-slate-500 text-sm mb-6">Enter your shop email and password</p>

          {error && (
            <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-3.5 py-3 rounded-sm text-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mb-4">
            <label className="text-sm font-medium text-slate-700 block mb-1.5" htmlFor="email">
              Shop email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError("") }}
              onKeyDown={handleKeyDown}
              placeholder="you@yourbusiness.com"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-sm text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2874f0] focus:ring-1 focus:ring-[#2874f0] transition-all"
            />
          </div>

          <div className="mb-2">
            <label className="text-sm font-medium text-slate-700 block mb-1.5" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError("") }}
                onKeyDown={handleKeyDown}
                placeholder="Enter your password"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-sm text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2874f0] focus:ring-1 focus:ring-[#2874f0] transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="text-right mb-5">
            <a href="#" className="text-sm text-[#2874f0] hover:underline">Forgot password?</a>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#fb641b] hover:bg-[#e55a17] disabled:opacity-60 text-white py-3 rounded-sm text-sm font-semibold transition-colors shadow-sm"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
            ) : "Login"}
          </button>

          <p className="mt-5 text-center text-sm text-slate-500">
            New seller?{" "}
            <Link href="/register" className="text-[#2874f0] font-medium hover:underline">
              Create your shop
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}