"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Camera, User, Mail, Phone, AtSign, Lock, Eye, EyeOff, Check, AlertTriangle, Package, Search, Clock, Trash2, MapPin, Plus, Pencil } from "lucide-react"

interface ActivityItem {
  type: "order" | "viewed" | "search"
  label: string
  sub?: string
  time: number
  href?: string
}

interface SavedAddress { fullName: string; phone: string; email: string; address: string; city: string; state: string; pincode: string; landmark: string }

export default function ProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<"info" | "password" | "activity">("info")
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [activity, setActivity] = useState<ActivityItem[]>([])

  const [form, setForm] = useState({ full_name: "", username: "", phone: "", email: "", avatar_url: "" })
  const [passwordForm, setPasswordForm] = useState({ old_password: "", new_password: "", confirm_password: "" })
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle")
  const [usernameLastChanged, setUsernameLastChanged] = useState<string | null>(null)
  const [originalUsername, setOriginalUsername] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Addresses
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [editingAddrIdx, setEditingAddrIdx] = useState<number | null>(null)
  const [addrForm, setAddrForm] = useState<SavedAddress>({ fullName: "", phone: "", email: "", address: "", city: "", state: "", pincode: "", landmark: "" })
  const [showAddrForm, setShowAddrForm] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [deleteError, setDeleteError] = useState("")
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("user")
    if (!stored) { router.push("/login"); return }
    const u = JSON.parse(stored)
    if (u.role === "seller") { router.push("/seller/dashboard"); return }
    setUser(u)
    setForm({ full_name: u.full_name || "", username: u.username || "", phone: u.phone || "", email: u.email || "", avatar_url: u.avatar_url || "" })
    setOriginalUsername(u.username || "")
    try { const all = localStorage.getItem("partly_all_addresses"); if (all) setAddresses(JSON.parse(all)) } catch {}
    try { const ch = localStorage.getItem("username_changed_at"); if (ch) setUsernameLastChanged(ch) } catch {}
    ;(async () => {
      try {
        const token = localStorage.getItem("token")
        if (token) {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          const json = await res.json()
          const profile = json.user
          if (profile) {
            const username = profile.username || ""
            setForm(f => ({ ...f, full_name: profile.full_name || f.full_name, username, phone: profile.phone || f.phone, email: profile.email || f.email, avatar_url: profile.avatar_url || f.avatar_url }))
            setOriginalUsername(username)
            localStorage.setItem("user", JSON.stringify({ ...u, ...profile }))
          }
        }
      } catch {}
    })()

    // Fetch activity from DB
    ;(async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/activity`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        const items: ActivityItem[] = []

        ;(data.orders || []).forEach((o: any) => items.push({
          type: "order",
          label: `Order #${o.id?.slice(-6).toUpperCase()}`,
          sub: `₹${o.total?.toLocaleString("en-IN")} · ${o.status}`,
          time: new Date(o.created_at).getTime(),
          href: "/orders"
        }))

        ;(data.viewed || []).forEach((v: any) => {
          const p = v.products
          if (p) items.push({
            type: "viewed",
            label: p.name,
            sub: `₹${p.price?.toLocaleString("en-IN")}`,
            time: new Date(v.viewed_at).getTime(),
            href: `/product/${p.id}`
          })
        })

        ;(data.searches || []).forEach((s: any) => items.push({
          type: "search",
          label: s.query,
          sub: s.condition ? `Condition: ${s.condition}` : undefined,
          time: new Date(s.searched_at).getTime(),
          href: `/search?q=${encodeURIComponent(s.query)}`
        }))

        items.sort((a, b) => b.time - a.time)
        setActivity(items)
      } catch {}
      setLoading(false)
    })()
  }, [])

  // Debounced username availability check — only fires if username changed from original
  useEffect(() => {
    if (!form.username || form.username === originalUsername) { setUsernameStatus("idle"); return }
    if (form.username.length < 3 || !/^[a-zA-Z0-9._]+$/.test(form.username)) { setUsernameStatus("idle"); return }
    setUsernameStatus("checking")
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/check-username?username=${encodeURIComponent(form.username)}`)
        const data = await res.json()
        setUsernameStatus(data.available ? "available" : "taken")
      } catch { setUsernameStatus("idle") }
    }, 500)
    return () => clearTimeout(timer)
  }, [form.username, originalUsername])

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError("Photo must be under 5MB"); return }
    setUploadingPhoto(true); setError("")
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(",")[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const formData = new FormData()
      formData.append("image", base64)
      formData.append("key", "02b4c7432d64053cdaebd47e3a9918ab")
      const imgRes = await fetch("https://api.imgbb.com/1/upload", { method: "POST", body: formData })
      const imgData = await imgRes.json()
      if (!imgData.success) { setError("Upload failed"); setUploadingPhoto(false); return }
      const url = imgData.data.url
      const token = localStorage.getItem("token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ avatar_url: url }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Upload failed"); setUploadingPhoto(false); return }
      const updated = { ...user, avatar_url: url }
      localStorage.setItem("user", JSON.stringify(updated))
      window.dispatchEvent(new Event("auth-change"))
      setUser(updated); setForm(f => ({ ...f, avatar_url: url }))
      setSuccess("Photo updated!"); setTimeout(() => setSuccess(""), 3000)
    } catch { setError("Upload failed") }
    setUploadingPhoto(false)
  }

  const handleSave = async () => {
    if (!form.full_name.trim()) { setError("Name is required"); return }
    if (form.username && !/^[a-zA-Z0-9._]{3,30}$/.test(form.username)) { setError("Invalid username format"); return }
    if (usernameStatus === "taken") { setError("This username is already taken."); return }
    if (usernameStatus === "checking") { setError("Please wait while we check username availability."); return }
    setSaving(true); setError(""); setSuccess("")
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ full_name: form.full_name, username: form.username, phone: form.phone }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Update failed"); setSaving(false); return }
      const updated = { ...user, ...data.user }
      if (form.username !== originalUsername && form.username) {
        const now = new Date().toISOString()
        localStorage.setItem("username_changed_at", now)
        setUsernameLastChanged(now)
      }
      localStorage.setItem("user", JSON.stringify(updated))
      window.dispatchEvent(new Event("auth-change"))
      setUser(updated); setSuccess("Profile updated!"); setTimeout(() => setSuccess(""), 3000)
    } catch { setError("Cannot connect to server") }
    setSaving(false)
  }

  const handlePasswordChange = async () => {
    setPasswordError(""); setPasswordSuccess("")
    if (!passwordForm.old_password) { setPasswordError("Enter your current password"); return }
    if (passwordForm.new_password.length < 6) { setPasswordError("New password must be at least 6 characters"); return }
    if (passwordForm.new_password !== passwordForm.confirm_password) { setPasswordError("Passwords do not match"); return }
    setSaving(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ old_password: passwordForm.old_password, new_password: passwordForm.new_password }),
      })
      const data = await res.json()
      if (!res.ok) { setPasswordError(data.error || "Failed to update password"); setSaving(false); return }
      setPasswordForm({ old_password: "", new_password: "", confirm_password: "" })
      setPasswordSuccess("Password updated successfully!")
      setTimeout(() => setPasswordSuccess(""), 3000)
    } catch { setPasswordError("Cannot connect to server") }
    setSaving(false)
  }

  const deleteAddress = (idx: number) => {
    const updated = addresses.filter((_, i) => i !== idx)
    setAddresses(updated)
    localStorage.setItem('partly_all_addresses', JSON.stringify(updated))
  }

  const saveAddress = () => {
    if (!addrForm.address.trim()) return
    const updated = editingAddrIdx !== null
      ? addresses.map((a, i) => i === editingAddrIdx ? addrForm : a)
      : [...addresses, addrForm]
    setAddresses(updated)
    localStorage.setItem('partly_all_addresses', JSON.stringify(updated))
    setShowAddrForm(false)
  }

  const handleDeleteAccount = async () => {
    if (!deletePassword) { setDeleteError("Please enter your password to confirm"); return }
    setDeleting(true); setDeleteError("")
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/delete-account`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: deletePassword }),
      })
      const data = await res.json()
      if (!res.ok) { setDeleteError(data.error || "Could not delete account"); setDeleting(false); return }
      // Clear everything and redirect
      localStorage.clear()
      window.location.href = "/?deleted=1"
    } catch { setDeleteError("Cannot connect to server"); setDeleting(false) }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-12 animate-pulse space-y-4">
        <div className="h-24 w-24 rounded-full bg-gray-200 mx-auto" />
        <div className="h-8 bg-gray-200 rounded-xl w-1/2 mx-auto" />
        <div className="h-40 bg-gray-200 rounded-2xl" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">

        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-blue-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
              {form.avatar_url
                ? <img src={form.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                : <User className="h-10 w-10 text-blue-400" />
              }
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-blue-700 transition-colors"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>
          <h1 className="mt-3 text-xl font-bold text-gray-900">{user?.full_name || "Your Profile"}</h1>
          <p className="text-sm text-gray-400">@{user?.username || user?.email?.split("@")[0]}</p>
          {uploadingPhoto && <p className="text-xs text-blue-500 mt-1">Uploading photo...</p>}
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-2xl border border-gray-100 shadow-sm p-1 mb-6">
          {(["info", "activity", "password"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-medium rounded-xl transition-colors ${
                activeTab === tab ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab === "info" ? "Personal Info" : tab === "activity" ? "Activity" : "Password"}
            </button>
          ))}
        </div>

        {/* Alerts */}
        {(success || error) && (
          <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-sm ${success ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {success ? <Check className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
            {success || error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          {activeTab === "activity" ? (
            <>
              {activity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Clock className="h-10 w-10 text-gray-200 mb-3" />
                  <p className="text-sm font-medium text-gray-500">No recent activity</p>
                  <p className="text-xs text-gray-400 mt-1">Your orders, viewed products and searches will appear here</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {activity.map((item, i) => {
                    const Icon = item.type === "order" ? Package : item.type === "search" ? Search : Clock
                    const iconColor = item.type === "order" ? "text-blue-500 bg-blue-50" : item.type === "search" ? "text-purple-500 bg-purple-50" : "text-gray-400 bg-gray-100"
                    const timeAgo = (() => {
                      const diff = Date.now() - item.time
                      if (diff < 60000) return "just now"
                      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
                      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
                      return `${Math.floor(diff / 86400000)}d ago`
                    })()
                    return (
                      <a
                        key={i}
                        href={item.href || "#"}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate group-hover:text-blue-600 transition-colors">{item.label}</p>
                          {item.sub && <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>}
                        </div>
                        <span className="text-xs text-gray-300 flex-shrink-0">{timeAgo}</span>
                      </a>
                    )
                  })}
                </div>
              )}
            </>
          ) : activeTab === "info" ? (
            <>
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2"><User className="h-4 w-4 text-gray-400" />Full Name</label>
                <input
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your full name"
                />
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2"><AtSign className="h-4 w-4 text-gray-400" />Username</label>
                <div className="relative">
                  <input
                    value={form.username}
                    onChange={e => { if (!usernameLastChanged || (Date.now() - new Date(usernameLastChanged).getTime()) > 365*24*60*60*1000) setForm(f => ({ ...f, username: e.target.value })) }}
                    readOnly={!!(usernameLastChanged && (Date.now() - new Date(usernameLastChanged).getTime()) < 365*24*60*60*1000)}
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-28 ${
                      usernameLastChanged && (Date.now() - new Date(usernameLastChanged).getTime()) < 365*24*60*60*1000
                        ? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-100"
                        : usernameStatus === "taken" ? "border-red-400" : usernameStatus === "available" ? "border-green-400" : "border-gray-200"
                    }`}
                    placeholder={form.username || "your_username"}
                  />
                  {usernameStatus === "checking" && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Checking...</span>}
                  {usernameStatus === "available" && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600 font-medium">✓ Available</span>}
                  {usernameStatus === "taken" && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-red-500 font-medium">✗ Taken</span>}
                </div>
                {usernameLastChanged && (Date.now() - new Date(usernameLastChanged).getTime()) < 365*24*60*60*1000
                  ? <p className="text-xs text-orange-500">Can change again on {new Date(new Date(usernameLastChanged).getTime() + 365*24*60*60*1000).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                  : usernameStatus === "taken"
                    ? <p className="text-xs text-red-500">This username is already taken.</p>
                    : <p className="text-xs text-gray-400">Letters, numbers, periods and underscores. 3–30 chars.</p>
                }
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2"><Phone className="h-4 w-4 text-gray-400" />Phone Number</label>
                <input
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  type="tel"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>

              {/* Email — read only */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2"><Mail className="h-4 w-4 text-gray-400" />Email Address</label>
                <input
                  value={form.email}
                  readOnly
                  className="w-full px-4 py-2.5 border border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400">Email cannot be changed.</p>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              {/* Saved Addresses */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-400" />Saved Addresses</h3>
                  <button
                    onClick={() => { setAddrForm({ fullName: "", phone: "", email: "", address: "", city: "", state: "", pincode: "", landmark: "" }); setEditingAddrIdx(null); setShowAddrForm(true) }}
                    className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add New
                  </button>
                </div>

                {addresses.length === 0 && !showAddrForm && (
                  <p className="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl">No saved addresses yet</p>
                )}

                <div className="space-y-2">
                  {addresses.map((addr, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-xl p-3 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{addr.fullName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{addr.address}{addr.city ? ', ' + addr.city : ''}{addr.state ? ', ' + addr.state : ''}{addr.pincode ? ' - ' + addr.pincode : ''}</p>
                        {addr.phone && <p className="text-xs text-gray-400">{addr.phone}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => { setAddrForm(addr); setEditingAddrIdx(idx); setShowAddrForm(true) }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => deleteAddress(idx)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {showAddrForm && (
                  <div className="mt-3 border border-gray-200 rounded-xl p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-900">{editingAddrIdx !== null ? 'Edit Address' : 'New Address'}</h4>
                    {[
                      { label: 'Full Name', key: 'fullName', placeholder: 'Full name' },
                      { label: 'Phone', key: 'phone', placeholder: '+91 XXXXX XXXXX' },
                      { label: 'Address', key: 'address', placeholder: 'House/Flat, Street' },
                      { label: 'Landmark', key: 'landmark', placeholder: 'Nearby landmark (optional)' },
                      { label: 'City', key: 'city', placeholder: 'City' },
                      { label: 'State', key: 'state', placeholder: 'State' },
                      { label: 'Pincode', key: 'pincode', placeholder: 'Pincode' },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key}>
                        <label className="text-xs font-medium text-gray-600">{label}</label>
                        <input
                          value={(addrForm as any)[key]}
                          onChange={e => setAddrForm(f => ({ ...f, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setShowAddrForm(false)}
                        className="flex-1 py-2 border border-gray-200 text-sm text-gray-600 rounded-xl hover:bg-gray-50">
                        Cancel
                      </button>
                      <button onClick={saveAddress} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl">
                        Save Address
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {(passwordError || passwordSuccess) && (
                <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${passwordSuccess ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  {passwordSuccess ? <Check className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
                  {passwordSuccess || passwordError}
                </div>
              )}

              {[
                { label: "Current Password", key: "old_password", show: showOld, toggle: () => setShowOld(v => !v) },
                { label: "New Password", key: "new_password", show: showNew, toggle: () => setShowNew(v => !v) },
                { label: "Confirm New Password", key: "confirm_password", show: showConfirm, toggle: () => setShowConfirm(v => !v) },
              ].map(({ label, key, show, toggle }) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2"><Lock className="h-4 w-4 text-gray-400" />{label}</label>
                  <div className="relative">
                    <input
                      type={show ? "text" : "password"}
                      value={(passwordForm as any)[key]}
                      onChange={e => setPasswordForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={handlePasswordChange}
                disabled={saving}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? "Updating..." : "Update Password"}
              </button>
            </>
          )}
        </div>
      </main>
      {activeTab === "info" && <div className="max-w-2xl mx-auto w-full px-4 pb-10">
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-red-200 text-red-500 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" /> Delete Account
          </button>
        ) : (
          <div className="bg-white border border-red-200 rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-red-600 flex items-center gap-2"><Trash2 className="h-4 w-4" /> Delete Account</h3>
              <p className="text-xs text-gray-500 mt-1">This is permanent. All your data, orders and saved items will be deleted and cannot be recovered.</p>
            </div>

            {deleteError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />{deleteError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Enter your password to confirm</label>
              <input
                type="password"
                value={deletePassword}
                onChange={e => { setDeletePassword(e.target.value); setDeleteError("") }}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); setDeleteError("") }}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, Delete My Account"}
              </button>
            </div>
          </div>
        )}
      </div>}
      <Footer />
    </div>
  )
}