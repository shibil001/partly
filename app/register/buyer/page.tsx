"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, AlertTriangle, Check, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

function generateCaptcha() {
  const num1 = Math.floor(Math.random() * 10)
  const num2 = Math.floor(Math.random() * 10)
  return { question: `${num1} + ${num2} = ?`, answer: num1 + num2 }
}

export default function BuyerRegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState("")
  // ✅ FIX: captcha initialized as null, generated client-side only in useEffect
  const [captcha, setCaptcha] = useState<{ question: string; answer: number } | null>(null)
  const [captchaInput, setCaptchaInput] = useState("")
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Generate captcha only on client to avoid hydration mismatch
  useEffect(() => {
    setCaptcha(generateCaptcha())
  }, [])

  // Debounced username availability check
  useEffect(() => {
    if (!formData.username || formData.username.length < 3) { setUsernameStatus("idle"); return }
    if (!/^[a-zA-Z0-9._]+$/.test(formData.username)) { setUsernameStatus("idle"); return }
    setUsernameStatus("checking")
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/check-username?username=${encodeURIComponent(formData.username)}`)
        const data = await res.json()
        setUsernameStatus(data.available ? "available" : "taken")
      } catch { setUsernameStatus("idle") }
    }, 500)
    return () => clearTimeout(timer)
  }, [formData.username])

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha())
    setCaptchaInput("")
    setErrors(p => ({ ...p, captcha: "" }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: { [key: string]: string } = {}

    if (!formData.full_name.trim()) newErrors.full_name = "Name is required"
    if (!formData.username.trim()) newErrors.username = "Username is required"
    else if (formData.username.length < 3) newErrors.username = "Username must be at least 3 characters"
    else if (formData.username.length > 30) newErrors.username = "Username must be 30 characters or less"
    else if (!/^[a-zA-Z0-9._]+$/.test(formData.username)) newErrors.username = "Only letters, numbers, periods and underscores allowed"
    else if (/^[._]/.test(formData.username)) newErrors.username = "Username can't start with a period or underscore"
    else if (/[._]$/.test(formData.username)) newErrors.username = "Username can't end with a period or underscore"
    else if (/[._]{2,}/.test(formData.username)) newErrors.username = "Username can't have consecutive periods or underscores"
    if (!formData.email.trim()) newErrors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Enter a valid email"
    if (!formData.phone.trim()) newErrors.phone = "Phone is required"
    if (!formData.password) newErrors.password = "Password is required"
    else if (formData.password.length < 6) newErrors.password = "Minimum 6 characters"
    if (!formData.confirm_password) newErrors.confirm_password = "Please confirm your password"
    else if (formData.password !== formData.confirm_password) newErrors.confirm_password = "Passwords do not match"
    if (!captchaInput) newErrors.captcha = "Please solve the security check"
    else if (captcha && parseInt(captchaInput) !== captcha.answer) {
      newErrors.captcha = "Wrong captcha — try the new one"
      setTimeout(() => refreshCaptcha(), 0)
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return
    if (usernameStatus === "taken") { setErrors({ username: "This username is already taken." }); return }
    if (usernameStatus === "checking") { setErrors({ username: "Please wait while we check username availability." }); return }

    setLoading(true)
    setServerError("")

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: formData.full_name,
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: "buyer",
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        // Map specific backend errors to the relevant field
        if (data.error === "Email already registered") {
          setErrors({ email: "This email is already registered. Try signing in instead." })
        } else if (data.error === "Username already taken") {
          setErrors({ username: "This username is taken — try another one." })
        } else {
          setServerError(data.error || "Something went wrong")
        }
        return
      }

      // Don't auto-login — redirect to login page with a success param
      router.push("/login?registered=1")

    } catch {
      setServerError("Cannot connect to server")
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
          <p className="text-sm text-gray-500">Create Account</p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <Card className="border border-gray-200 shadow-sm bg-white rounded-2xl">
          <CardContent className="p-6 md:p-8">

            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Create your account</h2>
              <p className="mt-1 text-sm text-gray-500">Join Partly and start finding parts across India</p>
            </div>

            {Object.keys(errors).length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800 mb-1">Please fix the following</p>
                    <ul className="text-xs text-red-600 space-y-0.5">
                      {Object.values(errors).map((err, i) => <li key={i}>• {err}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {serverError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-700">{serverError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Full Name + Username */}
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input id="full_name" name="full_name" placeholder="Enter your full name"
                    value={formData.full_name} onChange={handleChange}
                    className={errors.full_name ? "border-red-400" : ""} />
                  {errors.full_name && <p className="text-xs text-red-500">{errors.full_name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <Input id="username" name="username" placeholder="e.g. shibil_99"
                      value={formData.username} onChange={handleChange}
                      className={errors.username ? "border-red-400" : usernameStatus === "taken" ? "border-red-400" : usernameStatus === "available" ? "border-green-400" : ""} />
                    {usernameStatus === "checking" && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Checking...</span>
                    )}
                    {usernameStatus === "available" && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600 font-medium">✓ Available</span>
                    )}
                    {usernameStatus === "taken" && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-red-500 font-medium">✗ Taken</span>
                    )}
                  </div>
                  {errors.username
                    ? <p className="text-xs text-red-500">{errors.username}</p>
                    : usernameStatus === "taken"
                    ? <p className="text-xs text-red-500">This username is already taken.</p>
                    : <p className="text-xs text-gray-400">3–30 chars. Letters, numbers, periods, underscores. No spaces.</p>
                  }
                </div>
              </div>

              {/* Phone + Email */}
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" name="email" type="email" placeholder="you@example.com"
                    value={formData.email} onChange={handleChange}
                    className={errors.email ? "border-red-400" : ""} />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" name="phone" type="tel" placeholder="+91 XXXXX XXXXX"
                    value={formData.phone} onChange={handleChange}
                    className={errors.phone ? "border-red-400" : ""} />
                  {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                </div>
              </div>

              {/* Password row */}
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input id="password" name="password" type={showPassword ? "text" : "password"}
                      placeholder="Min. 6 characters" value={formData.password} onChange={handleChange}
                      className={errors.password ? "border-red-400" : ""} />
                    <button type="button" tabIndex={-1}
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm Password</Label>
                  <div className="relative">
                    <Input id="confirm_password" name="confirm_password" type={showConfirm ? "text" : "password"}
                      placeholder="Repeat your password" value={formData.confirm_password} onChange={handleChange}
                      className={errors.confirm_password ? "border-red-400" : ""} />
                    <button type="button" tabIndex={-1}
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {formData.confirm_password && !errors.confirm_password && formData.password === formData.confirm_password && (
                    <p className="text-xs text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> Passwords match</p>
                  )}
                  {errors.confirm_password && <p className="text-xs text-red-500">{errors.confirm_password}</p>}
                </div>
              </div>

              {/* Captcha — only renders after client mount */}
              <div className="space-y-2">
                <Label>Security Check</Label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-11 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center gap-3">
                    <span className="text-blue-700 font-bold text-base tracking-widest">
                      {captcha ? captcha.question : "Loading..."}
                    </span>
                    <button type="button" onClick={refreshCaptcha} className="text-blue-400 hover:text-blue-600 transition-colors" title="New question">
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <Input type="number" value={captchaInput} placeholder="Answer"
                    onChange={(e) => { setCaptchaInput(e.target.value); if (errors.captcha) setErrors(p => ({ ...p, captcha: "" })) }}
                    className={`w-28 ${errors.captcha ? "border-red-400" : ""}`} />
                </div>
                {errors.captcha && <p className="text-xs text-red-500">{errors.captcha}</p>}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 mt-2">
                <div className="text-sm text-gray-500 space-y-1">
                  <p>
                    Already have an account?{" "}
                    <Link href="/login" className="text-blue-600 font-semibold hover:underline">Sign In</Link>
                  </p>
                </div>
                <Button type="submit" disabled={loading} className="px-8">
                  {loading ? "Creating..." : "Create Account"}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}