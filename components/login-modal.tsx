"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

function generateCaptcha() {
  const num1 = Math.floor(Math.random() * 10)
  const num2 = Math.floor(Math.random() * 10)
  return { question: `${num1} + ${num2} = ?`, answer: num1 + num2 }
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [currentSlide, setCurrentSlide] = useState(0)

  // Captcha — client-side only to avoid hydration mismatch
  const [captcha, setCaptcha] = useState<{ question: string; answer: number } | null>(null)
  const [captchaInput, setCaptchaInput] = useState("")
  const [captchaError, setCaptchaError] = useState("")

  const adSlides = [
    {
      title: "Find Parts Fast",
      subtitle: "Search verified sellers across all India",
      bg: "bg-gradient-to-r from-blue-600 to-blue-500",
      icon: "🔍",
    },
    {
      title: "Secure Payments",
      subtitle: "Every order is escrow protected",
      bg: "bg-gradient-to-r from-indigo-600 to-indigo-500",
      icon: "🔒",
    },
    {
      title: "Verified Sellers",
      subtitle: "Trusted shops & individual sellers",
      bg: "bg-gradient-to-r from-sky-600 to-sky-500",
      icon: "✅",
    },
  ]

  // Generate captcha on client only
  useEffect(() => {
    setCaptcha(generateCaptcha())
  }, [])

  // Reset captcha when modal opens
  useEffect(() => {
    if (isOpen) {
      setCaptcha(generateCaptcha())
      setCaptchaInput("")
      setCaptchaError("")
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % adSlides.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [isOpen])

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha())
    setCaptchaInput("")
    setCaptchaError("")
  }

  const handleLogin = async () => {
    setError("")
    setCaptchaError("")

    if (!email || !password) {
      setError("Please enter email and password")
      return
    }
    if (!captchaInput) {
      setCaptchaError("Please solve the security check")
      return
    }
    if (captcha && parseInt(captchaInput) !== captcha.answer) {
      setCaptchaError("Wrong captcha — try again")
      setCaptchaInput("")
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Invalid email or password")
        refreshCaptcha()
        return
      }

      if (data.user?.role === "seller") {
        setError("This is a seller account. Please log in at the Seller Portal.")
        return
      }

      localStorage.setItem("token", data.token)
      if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token)
      else localStorage.removeItem("refresh_token")
      localStorage.setItem("user", JSON.stringify(data.user))
      // Restore saved cart from server
      if (data.cart && data.cart.length > 0) {
        localStorage.setItem("cart", JSON.stringify(data.cart))
      }
      window.dispatchEvent(new Event("auth-change"))
      window.dispatchEvent(new Event("cart-change"))
      onClose()
      router.push("/")

    } catch {
      setError("Cannot connect to server")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Ad Carousel Banner */}
        <div className="px-6 pt-6 flex-shrink-0">
          <div className="relative h-32 rounded-2xl overflow-hidden shadow-sm">
            {adSlides.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 ${slide.bg} flex items-center px-6 gap-4 transition-opacity duration-500 ${
                  currentSlide === index ? "opacity-100" : "opacity-0"
                }`}
              >
                <span className="text-3xl">{slide.icon}</span>
                <div>
                  <p className="text-lg font-bold text-white">{slide.title}</p>
                  <p className="text-xs text-white/80 mt-0.5">{slide.subtitle}</p>
                </div>
              </div>
            ))}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
              {adSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    currentSlide === index ? "bg-white w-4" : "bg-white/50 w-1.5"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-8 py-6">

          <h2 className="text-2xl font-bold text-gray-900">Login</h2>
          <p className="mt-1 text-gray-500 text-sm">
            or{" "}
            <a href="/register/buyer" className="text-blue-600 font-medium hover:underline">
              create an account
            </a>
          </p>
          <div className="w-8 h-0.5 bg-blue-600 mt-3" />

          {error && (
            <div className="mt-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Email */}
          <div className="mt-6">
            <label className="text-sm font-medium text-gray-900 block mb-1.5">
              Email<span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleLogin() }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter your email"
            />
          </div>

          {/* Password */}
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-900 block mb-1.5">
              Password<span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleLogin() }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter your password"
            />
          </div>

          {/* Forgot */}
          <div className="mt-2 text-right">
            <a href="#" className="text-blue-600 text-sm font-medium hover:underline">
              Forgot Password?
            </a>
          </div>

          {/* Captcha */}
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-900 block mb-1.5">
              Security Check<span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-11 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center gap-2">
                <span className="text-blue-700 font-bold text-base tracking-widest">
                  {captcha ? captcha.question : "..."}
                </span>
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  className="text-blue-400 hover:text-blue-600 transition-colors"
                  title="New question"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
              <input
                type="number"
                value={captchaInput}
                onChange={(e) => { setCaptchaInput(e.target.value); setCaptchaError("") }}
                onKeyDown={(e) => { if (e.key === "Enter") handleLogin() }}
                placeholder="Answer"
                className={`w-24 px-3 py-3 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${captchaError ? "border-red-400" : "border-gray-300"}`}
              />
            </div>
            {captchaError && <p className="text-xs text-red-500 mt-1">{captchaError}</p>}
          </div>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full mt-5 bg-blue-600 text-white py-3.5 rounded-lg font-medium text-base hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="mt-6 text-center text-sm text-gray-500">
            Are you a seller?{" "}
            <a href="/seller" className="font-semibold text-blue-600 hover:underline">
              Login / Register here
            </a>
          </p>


        </div>
      </div>
    </>
  )
}