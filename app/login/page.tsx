"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, AlertTriangle, RefreshCw, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

function generateCaptcha() {
  const num1 = Math.floor(Math.random() * 10)
  const num2 = Math.floor(Math.random() * 10)
  return { question: `${num1} + ${num2} = ?`, answer: num1 + num2 }
}

import { Suspense } from "react"

function LoginPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const justRegistered = searchParams.get("registered") === "1"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Captcha — client-side only to avoid hydration mismatch
  const [captcha, setCaptcha] = useState<{ question: string; answer: number } | null>(null)
  const [captchaInput, setCaptchaInput] = useState("")
  const [captchaError, setCaptchaError] = useState("")

  useEffect(() => {
    setCaptcha(generateCaptcha())
  }, [])

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha())
    setCaptchaInput("")
    setCaptchaError("")
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setCaptchaError("")

    if (!email || !password) { setError("Please enter your email and password"); return }
    if (!captchaInput) { setCaptchaError("Please solve the security check"); return }
    if (captcha && parseInt(captchaInput) !== captcha.answer) {
      setCaptchaError("Wrong captcha — try the new one")
      refreshCaptcha()
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
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
      localStorage.setItem("user", JSON.stringify(data.user))
      // Restore saved cart from server
      if (data.cart && data.cart.length > 0) {
        localStorage.setItem("cart", JSON.stringify(data.cart))
      }
      window.dispatchEvent(new Event("auth-change"))
      window.dispatchEvent(new Event("cart-change"))
      const redirectTo = searchParams.get("redirect")
      if (redirectTo && redirectTo.startsWith("http://localhost:3001")) {
        window.location.href = redirectTo + "?token=" + encodeURIComponent(data.token)
      } else {
        router.push("/")
      }

    } catch {
      setError("Cannot connect to server")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center gap-3">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">PARTLY</span>
          </a>
          <div className="h-6 w-px bg-gray-200" />
          <p className="text-sm text-gray-500">Sign In</p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <Card className="border border-gray-200 shadow-sm bg-white rounded-2xl">
          <CardContent className="p-6 md:p-8">

            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Welcome back</h2>
              <p className="mt-1 text-sm text-gray-500">Sign in to your Partly account</p>
            </div>

            {justRegistered && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                <p className="text-sm text-green-700">Account created! Please sign in to continue.</p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="you@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    autoFocus />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <a href="#" className="text-xs text-blue-600 hover:underline">Forgot Password?</a>
                  </div>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" tabIndex={-1}
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Captcha */}
              <div className="space-y-2">
                <Label>Security Check</Label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-11 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center gap-2">
                    <span className="text-blue-700 font-bold text-base tracking-widest">
                      {captcha ? captcha.question : "..."}
                    </span>
                    <button type="button" onClick={refreshCaptcha}
                      className="text-blue-400 hover:text-blue-600 transition-colors" title="New question">
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <Input type="number" value={captchaInput} placeholder="Answer"
                    onChange={(e) => { setCaptchaInput(e.target.value); setCaptchaError("") }}
                    className={`w-28 ${captchaError ? "border-red-400" : ""}`} />
                </div>
                {captchaError && <p className="text-xs text-red-500">{captchaError}</p>}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 mt-2">
                <p className="text-sm text-gray-500">
                  Don't have an account?{" "}
                  <Link href="/register/buyer" className="text-blue-600 font-semibold hover:underline">Create one</Link>
                </p>
                <Button type="submit" disabled={loading} className="px-8">
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default function BuyerLoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  )
}