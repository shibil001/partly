"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { SellerSidebar } from "@/components/seller/dashboard/shared/sidebar"
import { SellerHeader } from "@/components/seller/dashboard/shared/header"
import {
  Camera, Store, Mail, Phone, MapPin,
  Check, AlertTriangle, Eye, Edit2, Shield, Clock, GripVertical, Package, Sparkles,
  Type, ImageIcon, Trash2, Plus, MoveUp, MoveDown,
  Bold, Italic, AlignLeft, AlignCenter, AlignRight, Heading2, ExternalLink
} from "lucide-react"

export default function SellerShopEditPage() {
  const router = useRouter()
  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const aboutEditorRef = useRef<HTMLDivElement>(null)
  const savedRangeRef = useRef<Range | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [shop, setShop] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [editing, setEditing] = useState(false)
  const [aboutBlocks, setAboutBlocks] = useState<any[]>([])
  const [savingAbout, setSavingAbout] = useState(false)
  const [aboutSuccess, setAboutSuccess] = useState(false)
  const [blockDropOpen, setBlockDropOpen] = useState(false)
  const [activeBlockLabel, setActiveBlockLabel] = useState("Text")
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([])
  const [savingOrder, setSavingOrder] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)

  const [form, setForm] = useState({
    shop_name: "",
    description: "",
    shop_phone: "",
    shop_email: "",
    bank_city: "",
    bank_country: "India",
    logo_url: "",
    cover_url: "",
    custom_tag: "",
    show_category_tag: false,
  })

  useEffect(() => {
    const token = localStorage.getItem("seller_token")
    if (!token) { router.push("/seller/login"); return }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sellers/shop`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data?.shop) {
          const s = data.shop
          setShop(s)
          setForm({
            shop_name: s.shop_name || "",
            description: s.description || "",
            shop_phone: "",        // intentionally blank — seller must type fresh
            shop_email: "",        // intentionally blank — seller must type fresh
            bank_city: s.bank_city || "",
            bank_country: s.bank_country || "India",
            logo_url: s.logo_url || "",
            cover_url: s.cover_url || "",
            custom_tag: s.custom_tag || "",
            show_category_tag: s.show_category_tag || false,
          })
          // Load about content
          if (s.about_blocks) {
            try {
              const parsed = typeof s.about_blocks === 'string' ? JSON.parse(s.about_blocks) : s.about_blocks
              if (Array.isArray(parsed) && parsed.length > 0) {
                setAboutBlocks(parsed)
              }
            } catch {}
          }
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))

    // Fetch seller's published products for ordering
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sellers/products`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data?.products) {
          const published = data.products
            .filter((p: any) => p.status === "Published")
            .sort((a: any, b: any) => {
              if (a.display_order != null && b.display_order != null) return a.display_order - b.display_order
              if (a.display_order != null) return -1
              if (b.display_order != null) return 1
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            })
          setFeaturedProducts(published)
        }
      })
      .catch(() => {})
  }, [])

  const uploadImage = async (file: File, field: "logo_url" | "cover_url") => {
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5MB"); return }
    setUploading(field === "logo_url" ? "logo" : "cover")
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
      if (!imgData.success) { setError("Image upload failed"); return }
      const url = imgData.data.url
      const token = localStorage.getItem("seller_token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sellers/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ [field]: url }),
      })
      if (res.ok) {
        setForm(f => ({ ...f, [field]: url }))
        setShop((s: any) => ({ ...s, [field]: url }))
        const stored = JSON.parse(localStorage.getItem("seller_shop") || "{}")
        localStorage.setItem("seller_shop", JSON.stringify({ ...stored, [field]: url }))
        setSuccess(field === "logo_url" ? "Logo updated!" : "Cover updated!")
        setTimeout(() => setSuccess(""), 3000)
      }
    } catch { setError("Upload failed") }
    setUploading(null)
  }

  const handleSave = async () => {
    if (!form.shop_name.trim()) { setError("Shop name is required"); return }
    setSaving(true); setError(""); setSuccess("")
    try {
      const token = localStorage.getItem("seller_token")

      // Only include email/phone if seller typed something — avoids wiping existing values
      const payload: any = {
        shop_name: form.shop_name,
        description: form.description,
        bank_city: form.bank_city,
        bank_country: form.bank_country,
        custom_tag: form.custom_tag.trim(),
        show_category_tag: form.show_category_tag,
      }
      if (form.shop_email.trim()) payload.shop_email = form.shop_email.trim()
      if (form.shop_phone.trim()) payload.shop_phone = form.shop_phone.trim()

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sellers/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Update failed"); setSaving(false); return }

      // Use the DB-returned shop so the dashboard reflects exactly what was saved
      const updatedShop = data.shop
      setShop(updatedShop)
      localStorage.setItem("seller_shop", JSON.stringify(updatedShop))
      setSuccess("Profile updated!"); setEditing(false)
      setTimeout(() => setSuccess(""), 3000)
    } catch { setError("Cannot connect to server") }
    setSaving(false)
  }

  const saveOrder = async () => {
    setSavingOrder(true)
    const token = localStorage.getItem("seller_token")
    const ordered = featuredProducts.slice(0, 12).map((p, i) => ({ id: p.id, display_order: i }))
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sellers/products/order`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ order: ordered }),
      })
      setOrderSuccess(true)
      setTimeout(() => setOrderSuccess(false), 3000)
    } catch {}
    setSavingOrder(false)
  }

  const handleDragStart = (index: number) => { dragItem.current = index }
  const handleDragEnter = (index: number) => { dragOverItem.current = index }
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return
    const updated = [...featuredProducts]
    const dragged = updated.splice(dragItem.current, 1)[0]
    updated.splice(dragOverItem.current, 0, dragged)
    setFeaturedProducts(updated)
    dragItem.current = null
    dragOverItem.current = null
  }

  // Populate editor from state whenever aboutBlocks loads from DB
  useEffect(() => {
    if (aboutBlocks.length > 0 && aboutEditorRef.current) {
      const content = aboutBlocks[0]?.content || ""
      if (aboutEditorRef.current.innerHTML !== content) {
        aboutEditorRef.current.innerHTML = content
      }
    }
  }, [aboutBlocks])

  const saveAbout = async () => {
    setSavingAbout(true)
    const token = localStorage.getItem("seller_token")
    const content = aboutEditorRef.current?.innerHTML || ""
    const blocks = [{ type: "html", content }]
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sellers/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ about_blocks: blocks }),
      })
      if (res.ok) { setAboutSuccess(true); setTimeout(() => setAboutSuccess(false), 3000) }
    } catch {}
    setSavingAbout(false)
  }

  const addBlock = (type: "text" | "image") => {
    setAboutBlocks(b => [...b, type === "text" ? { type: "text", content: "" } : { type: "image", url: "", caption: "" }])
  }

  const updateBlock = (i: number, patch: any) => {
    setAboutBlocks(b => b.map((block, idx) => idx === i ? { ...block, ...patch } : block))
  }

  const removeBlock = (i: number) => setAboutBlocks(b => b.filter((_, idx) => idx !== i))

  const moveBlock = (i: number, dir: -1 | 1) => {
    setAboutBlocks(b => {
      const next = [...b]
      const j = i + dir
      if (j < 0 || j >= next.length) return next;
      [next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  const uploadAboutImage = async (i: number, file: File) => {
    if (file.size > 5 * 1024 * 1024) return
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
      if (imgData.success) updateBlock(i, { url: imgData.data.url })
    } catch {}
  }

  const memberSince = shop?.created_at
    ? new Date(shop.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : ""

  if (loading) return (
    <div className="flex h-screen bg-gray-50">
      <SellerSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <SellerHeader />
        <main className="flex-1 overflow-y-auto p-6 animate-pulse">
          <div className="h-52 bg-gray-200 mb-4" />
          <div className="h-6 bg-gray-200 rounded w-1/3" />
        </main>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      <SellerSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <SellerHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="w-full pb-10">

            {/* Alerts */}
            {(success || error) && (
              <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-sm ${success ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {success ? <Check className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
                {success || error}
              </div>
            )}

            {/* Profile box */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">

            {/* Cover photo */}
            <div className="relative h-52 bg-gradient-to-r from-blue-600 to-blue-400 group">
              {form.cover_url && (
                <img src={form.cover_url} alt="cover" className="w-full h-full object-cover" />
              )}
              <button
                onClick={() => coverInputRef.current?.click()}
                disabled={uploading === "cover"}
                className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors"
              >
                <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white text-sm font-medium px-4 py-2 rounded-full flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  {uploading === "cover" ? "Uploading..." : "Change Cover"}
                </span>
              </button>
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, "cover_url") }} />
            </div>

            {/* Profile card */}
            <div className="bg-white">
              <div className="px-6">

                {/* Avatar row */}
                <div className="flex items-start justify-between">
                  <div className="relative group z-10 -mt-12">
                    <div className="w-24 h-24 rounded-full border-4 border-white bg-blue-100 overflow-hidden flex items-center justify-center shadow-lg">
                      {form.logo_url
                        ? <img src={form.logo_url} alt="logo" className="w-full h-full object-cover" />
                        : <Store className="h-10 w-10 text-blue-600" />
                      }
                    </div>
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploading === "logo"}
                      className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors"
                    >
                      <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, "logo_url") }} />
                  </div>
                </div>

                {/* Name + meta + action buttons */}
                <div className="flex items-end justify-between mt-2">

                  {/* Left: name, username, description, meta */}
                  <div className="flex-1 min-w-0">

                    {/* Shop name */}
                    {editing ? (
                      <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 mb-2 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-gray-300">
                        <input
                          value={form.shop_name}
                          onChange={e => setForm(f => ({ ...f, shop_name: e.target.value }))}
                          placeholder="Shop name"
                          className="text-xl font-bold text-gray-900 bg-transparent outline-none flex-1"
                        />
                        <Edit2 className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-0.5">
                        <h1 className="text-xl font-bold text-gray-900">{shop?.shop_name}</h1>
                        {shop?.status === "approved" && (
                          <span className="text-blue-500">
                            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91-1.01-1.01-2.52-1.27-3.91-.81-.67-1.31-1.9-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81-1.01 1.01-1.27 2.52-.81 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91 1.01 1.01 2.52 1.27 3.91.81.67 1.31 1.9 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81 1.01-1.01 1.27-2.52.81-3.91 1.31-.67 2.19-1.9 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/></svg>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Username — always read-only, never editable */}
                    <p className="text-sm text-gray-400 mb-2">@{shop?.shop_username}</p>

                    {/* Description */}
                    {editing ? (
                      <div className="flex items-start gap-2 border border-gray-200 rounded-xl px-3 py-2 mb-3 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-gray-300">
                        <textarea
                          value={form.description}
                          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                          rows={2}
                          placeholder="Tell customers about your shop..."
                          className="flex-1 text-sm text-gray-700 bg-transparent outline-none resize-none"
                        />
                        <Edit2 className="h-3.5 w-3.5 text-gray-300 shrink-0 mt-0.5" />
                      </div>
                    ) : (
                      shop?.description && (
                        <p className="text-sm text-gray-600 leading-relaxed mb-2 max-w-2xl">{shop.description}</p>
                      )
                    )}

                    {/* Meta — view mode: all inline */}
                    {!editing && (
                      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500 mb-1">
                        {shop?.shop_email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{shop.shop_email}</span>}
                        {shop?.shop_phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{shop.shop_phone}</span>}
                        {memberSince && <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Since {memberSince}</span>}
                        {shop?.bank_city && (
                          <span className="flex items-center gap-1.5 w-full">
                            <MapPin className="h-3.5 w-3.5" />{shop.bank_city}{shop.bank_country ? `, ${shop.bank_country}` : ""}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Meta — edit mode: each field in its own box */}
                    {editing && (
                      <div className="flex flex-col gap-2 mb-1">
                        {/* Row 1: email, phone, since */}
                        <div className="flex flex-wrap gap-2">
                          {/* Email */}
                          <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-gray-300 flex-1 min-w-48">
                            <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <input
                              value={form.shop_email}
                              onChange={e => setForm(f => ({ ...f, shop_email: e.target.value }))}
                              placeholder="Public email"
                              className="bg-transparent outline-none text-sm text-gray-700 flex-1 min-w-0"
                            />
                            <Edit2 className="h-3 w-3 text-gray-300 shrink-0" />
                          </div>
                          {/* Phone */}
                          <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-gray-300 flex-1 min-w-36">
                            <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <input
                              value={form.shop_phone}
                              onChange={e => setForm(f => ({ ...f, shop_phone: e.target.value }))}
                              placeholder="Phone number"
                              className="bg-transparent outline-none text-sm text-gray-700 flex-1 min-w-0"
                            />
                            <Edit2 className="h-3 w-3 text-gray-300 shrink-0" />
                          </div>
                          {/* Since — read-only box */}
                          {memberSince && (
                            <div className="flex items-center gap-2 border border-gray-100 rounded-xl px-3 py-2 bg-gray-50 text-sm text-gray-400">
                              <Clock className="h-3.5 w-3.5 shrink-0" />
                              Since {memberSince}
                            </div>
                          )}
                        </div>
                        {/* Row 2: location full width */}
                        <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-gray-300">
                          <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <input
                            value={form.bank_city}
                            onChange={e => setForm(f => ({ ...f, bank_city: e.target.value }))}
                            placeholder="City / Location"
                            className="bg-transparent outline-none text-sm text-gray-700 flex-1"
                          />
                          <Edit2 className="h-3 w-3 text-gray-300 shrink-0" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: View Page + Edit/Save buttons — parallel to meta row */}
                  <div className="flex items-center gap-2 flex-shrink-0 ml-6 pb-0.5">
                    {shop?.shop_username && (
                      <a href={`/shop/${shop.shop_username}`} target="_blank"
                        className="flex items-center gap-1.5 px-4 py-1.5 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        <Eye className="h-3.5 w-3.5" /> View Page
                      </a>
                    )}
                    {editing ? (
                      <>
                        <button onClick={() => { setEditing(false); setError("") }}
                          className="px-4 py-1.5 border border-gray-300 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                          Cancel
                        </button>
                        <button onClick={handleSave} disabled={saving}
                          className="px-4 py-1.5 bg-gray-900 text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50">
                          {saving ? "Saving..." : "Save"}
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setEditing(true)}
                        className="flex items-center gap-1.5 px-4 py-1.5 border border-gray-300 rounded-full text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                        <Edit2 className="h-3.5 w-3.5" /> Edit Profile
                      </button>
                    )}
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mt-3 mb-4">
                  <button
                    onClick={async () => {
                      const newVal = shop?.show_condition_badge === false ? true : false
                      const token = localStorage.getItem("seller_token")
                      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sellers/profile`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ show_condition_badge: newVal }),
                      })
                      if (res.ok) {
                        setShop((s: any) => ({ ...s, show_condition_badge: newVal }))
                        const stored = JSON.parse(localStorage.getItem("seller_shop") || "{}")
                        localStorage.setItem("seller_shop", JSON.stringify({ ...stored, show_condition_badge: newVal }))
                      }
                    }}
                    title={shop?.show_condition_badge === false ? "Hidden from store — click to show" : "Visible in store — click to hide"}
                    className={`relative px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
                      shop?.show_condition_badge === false
                        ? "opacity-40 grayscale border-dashed cursor-pointer"
                        : "cursor-pointer"
                    } ${
                      shop?.product_condition === "new"
                        ? "bg-green-50 text-green-700 border-green-100"
                        : shop?.product_condition === "used"
                        ? "bg-orange-50 text-orange-700 border-orange-100"
                        : "bg-blue-50 text-blue-700 border-blue-100"
                    }`}
                  >
                    {shop?.product_condition === "new" ? "New Products"
                      : shop?.product_condition === "used" ? "Used Products"
                      : "New & Used Products"}
                    <span className="ml-1.5 text-[10px] font-normal opacity-60">
                      {shop?.show_condition_badge === false ? "hidden" : "visible"}
                    </span>
                  </button>
                  {shop?.has_physical_store && (
                    <button
                      onClick={async () => {
                        const newVal = shop?.show_physical_tag === false ? true : false
                        const token = localStorage.getItem("seller_token")
                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sellers/profile`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ show_physical_tag: newVal }),
                        })
                        if (res.ok) {
                          setShop((s: any) => ({ ...s, show_physical_tag: newVal }))
                          const stored = JSON.parse(localStorage.getItem("seller_shop") || "{}")
                          localStorage.setItem("seller_shop", JSON.stringify({ ...stored, show_physical_tag: newVal }))
                        }
                      }}
                      title={shop?.show_physical_tag === false ? "Hidden from store — click to show" : "Visible in store — click to hide"}
                      className={`px-3 py-1 text-xs font-medium rounded-full border flex items-center gap-1 transition-all cursor-pointer ${
                        shop?.show_physical_tag === false
                          ? "opacity-40 grayscale border-dashed bg-gray-50 text-gray-600 border-gray-100"
                          : "bg-gray-50 text-gray-600 border-gray-100"
                      }`}
                    >
                      <Store className="h-3 w-3" /> Physical Store
                      <span className="ml-1 text-[10px] font-normal opacity-60">
                        {shop?.show_physical_tag === false ? "hidden" : "visible"}
                      </span>
                    </button>
                  )}
                  {shop?.has_gst && (
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-50 text-gray-600 border border-gray-100 flex items-center gap-1">
                      <Shield className="h-3 w-3 text-green-500" /> GST Verified
                    </span>
                  )}
                  {shop?.categories?.map((cat: string) => (
                    <button
                      key={cat}
                      onClick={async () => {
                        const newVal = shop?.show_category_tag === false ? true : false
                        const token = localStorage.getItem("seller_token")
                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sellers/profile`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ show_category_tag: newVal }),
                        })
                        if (res.ok) {
                          setShop((s: any) => ({ ...s, show_category_tag: newVal }))
                          const stored = JSON.parse(localStorage.getItem("seller_shop") || "{}")
                          localStorage.setItem("seller_shop", JSON.stringify({ ...stored, show_category_tag: newVal }))
                        }
                      }}
                      title={shop?.show_category_tag === false ? "Hidden from store — click to show" : "Visible in store — click to hide"}
                      className={`px-3 py-1 text-xs font-medium rounded-full border flex items-center gap-1 transition-all cursor-pointer ${
                        shop?.show_category_tag === false
                          ? "opacity-40 grayscale border-dashed bg-purple-50 text-purple-700 border-purple-100"
                          : "bg-purple-50 text-purple-700 border-purple-100"
                      } capitalize`}
                    >
                      {cat}
                      <span className="ml-1 text-[10px] font-normal opacity-60">
                        {shop?.show_category_tag === false ? "hidden" : "visible"}
                      </span>
                    </button>
                  ))}
                  {/* Custom tag — editable in edit mode, shown as badge in view mode */}
                  {editing ? (
                    <div className="flex items-center gap-1 px-2 py-1 border border-dashed border-gray-300 rounded-full bg-gray-50 focus-within:border-blue-300 focus-within:bg-blue-50 transition-colors">
                      <input
                        value={form.custom_tag}
                        onChange={e => setForm(f => ({ ...f, custom_tag: e.target.value.slice(0, 24) }))}
                        placeholder="+ custom tag"
                        maxLength={24}
                        className="bg-transparent outline-none text-xs text-gray-600 w-24 placeholder:text-gray-400"
                      />
                      {form.custom_tag && (
                        <button onClick={() => setForm(f => ({ ...f, custom_tag: "" }))} className="text-gray-300 hover:text-gray-500 text-sm leading-none">×</button>
                      )}
                    </div>
                  ) : (
                    shop?.custom_tag && (
                      <button
                        onClick={async () => {
                          const newVal = shop?.show_custom_tag === false ? true : false
                          const token = localStorage.getItem("seller_token")
                          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sellers/profile`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ show_custom_tag: newVal }),
                          })
                          if (res.ok) {
                            setShop((s: any) => ({ ...s, show_custom_tag: newVal }))
                            const stored = JSON.parse(localStorage.getItem("seller_shop") || "{}")
                            localStorage.setItem("seller_shop", JSON.stringify({ ...stored, show_custom_tag: newVal }))
                          }
                        }}
                        title={shop?.show_custom_tag === false ? "Hidden from store — click to show" : "Visible in store — click to hide"}
                        className={`px-3 py-1 text-xs font-medium rounded-full border flex items-center gap-1 transition-all cursor-pointer ${
                          shop?.show_custom_tag === false
                            ? "opacity-40 grayscale border-dashed bg-amber-50 text-amber-700 border-amber-100"
                            : "bg-amber-50 text-amber-700 border-amber-100"
                        }`}
                      >
                        {shop.custom_tag}
                        <span className="ml-1 text-[10px] font-normal opacity-60">
                          {shop?.show_custom_tag === false ? "hidden" : "visible"}
                        </span>
                      </button>
                    )
                  )}
                  {/* Show category tag toggle */}
                  {editing && (
                    <label className="flex items-center gap-2 cursor-pointer mt-1">
                      <div
                        onClick={() => setForm(f => ({ ...f, show_category_tag: !f.show_category_tag }))}
                        className={`w-8 h-4 rounded-full transition-colors flex items-center px-0.5 ${form.show_category_tag ? "bg-blue-600" : "bg-gray-200"}`}
                      >
                        <div className={`w-3 h-3 rounded-full bg-white transition-transform ${form.show_category_tag ? "translate-x-4" : "translate-x-0"}`} />
                      </div>
                      <span className="text-xs text-gray-500">Show category tag on product page</span>
                    </label>
                  )}
                </div>

              </div>
            </div>
            </div>{/* end profile box */}


            {/* New Releases Order Manager */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  <h3 className="text-sm font-semibold text-gray-800">New Releases</h3>
                  <span className="text-xs text-gray-400 font-normal">— drag to reorder · top 12 shown in store</span>
                </div>
                <button
                  onClick={saveOrder}
                  disabled={savingOrder || featuredProducts.length === 0}
                  className="px-4 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-full hover:bg-gray-800 disabled:opacity-40 transition-colors flex items-center gap-1.5"
                >
                  {savingOrder ? "Saving..." : orderSuccess ? "✓ Saved" : "Save Order"}
                </button>
              </div>

              {featuredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Package className="h-10 w-10 text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">No published products yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-6 gap-2">
                  {featuredProducts.map((product, index) => (
                    <div
                      key={product.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragEnter={() => handleDragEnter(index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={e => e.preventDefault()}
                      className={`relative group bg-gray-50 border rounded-xl overflow-hidden cursor-grab active:cursor-grabbing transition-all ${
                        index < 12 ? "border-blue-100 ring-1 ring-blue-50" : "border-gray-100 opacity-50"
                      }`}
                    >
                      {/* Position badge */}
                      <div className={`absolute top-1.5 left-1.5 z-10 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                        index < 12 ? "bg-blue-600 text-white" : "bg-gray-300 text-white"
                      }`}>
                        {index + 1}
                      </div>
                      {/* Drag handle */}
                      <div className="absolute top-1.5 right-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                      </div>
                      {/* Image */}
                      <div className="aspect-square bg-white">
                        {product.image || (Array.isArray(product.images) && product.images[0])
                          ? <img src={product.image || product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Package className="h-8 w-8 text-gray-200" /></div>
                        }
                      </div>
                      {/* Name + price */}
                      <div className="p-2">
                        <p className="text-[11px] font-semibold text-gray-700 truncate">{product.name}</p>
                        <p className="text-[11px] text-gray-500">₹{Number(product.price)?.toLocaleString("en-IN")}</p>
                      </div>
                      {/* Hidden label for items beyond 8 */}
                      {index >= 12 && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                          <span className="text-[10px] text-gray-400 font-medium">not shown</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>


            {/* About Page Editor */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4 text-blue-500" />
                  <h3 className="text-sm font-semibold text-gray-800">About Page</h3>
                  <span className="text-xs text-gray-400 font-normal">— shown in the About tab of your store</span>
                </div>
                <button
                  onClick={saveAbout}
                  disabled={savingAbout}
                  className="px-4 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-full hover:bg-gray-800 disabled:opacity-40 transition-colors"
                >
                  {savingAbout ? "Saving..." : aboutSuccess ? "✓ Saved" : "Save About"}
                </button>
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-1 px-2 py-1.5 border border-gray-200 rounded-t-xl bg-gray-50 flex-wrap">
                {/* Block style dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onMouseDown={e => { e.preventDefault(); setBlockDropOpen(v => !v) }}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-200 border border-gray-200 bg-white transition-colors"
                  >
                    {activeBlockLabel}
                    <svg className="h-3 w-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                  {blockDropOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onMouseDown={() => setBlockDropOpen(false)} />
                      <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                        {[
                          { label: "Text", tag: "p", icon: "Ai" },
                          { label: "Header", tag: "h1", icon: "H1" },
                          { label: "Title", tag: "h2", icon: "H2" },
                          { label: "Subtitle", tag: "h3", icon: "H3" },
                          { label: "Paragraph", tag: "p", icon: "¶" },
                        ].map(({ label, tag, icon }) => (
                          <button
                            key={label}
                            type="button"
                            onMouseDown={e => {
                              e.preventDefault()
                              aboutEditorRef.current?.focus()
                              if (label === "Paragraph" || label === "Text") {
                                document.execCommand("formatBlock", false, "p")
                                document.execCommand("removeFormat")
                                // Force reset font size and weight on the current block
                                const sel = window.getSelection()
                                if (sel && sel.rangeCount > 0) {
                                  const range = sel.getRangeAt(0)
                                  let node: Node | null = sel.anchorNode
                                  while (node && node !== aboutEditorRef.current) {
                                    if ((node as HTMLElement).style) {
                                      (node as HTMLElement).style.fontSize = ""
                                      ;(node as HTMLElement).style.fontWeight = ""
                                      ;(node as HTMLElement).style.fontStyle = ""
                                    }
                                    node = node.parentNode
                                  }
                                }
                              } else {
                                document.execCommand("formatBlock", false, tag)
                              }
                              setActiveBlockLabel(label)
                              setBlockDropOpen(false)
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <span className="text-xs font-mono w-6 text-gray-400">{icon}</span>
                            {label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div className="w-px h-5 bg-gray-200 mx-0.5" />
                <button onMouseDown={e => { e.preventDefault(); aboutEditorRef.current?.focus(); document.execCommand("bold") }} title="Bold" className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"><Bold className="h-3.5 w-3.5" /></button>
                <button onMouseDown={e => { e.preventDefault(); aboutEditorRef.current?.focus(); document.execCommand("italic") }} title="Italic" className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"><Italic className="h-3.5 w-3.5" /></button>
                <div className="w-px h-4 bg-gray-200 mx-0.5" />
                <button onMouseDown={e => { e.preventDefault(); aboutEditorRef.current?.focus(); document.execCommand("justifyLeft") }} title="Left" className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"><AlignLeft className="h-3.5 w-3.5" /></button>
                <button onMouseDown={e => { e.preventDefault(); aboutEditorRef.current?.focus(); document.execCommand("justifyCenter") }} title="Center" className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"><AlignCenter className="h-3.5 w-3.5" /></button>
                <button onMouseDown={e => { e.preventDefault(); aboutEditorRef.current?.focus(); document.execCommand("justifyRight") }} title="Right" className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"><AlignRight className="h-3.5 w-3.5" /></button>
                <div className="w-px h-4 bg-gray-200 mx-0.5" />
                {/* Image insert */}
                <label
                  title="Insert image (full width, max 3MB)"
                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors cursor-pointer flex items-center gap-1"
                  onMouseDown={() => {
                    // Capture cursor range while editor still has focus
                    const sel = window.getSelection()
                    savedRangeRef.current = sel && sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null
                  }}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span className="text-[10px] text-gray-400">Image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    if (file.size > 3 * 1024 * 1024) { alert("Image must be under 3MB."); return }
                    ;(async () => {
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
                        if (!imgData.success) { alert("Image upload failed"); return }
                        const url = imgData.data.url
                        const editor = aboutEditorRef.current
                        if (!editor) return
                        editor.focus()
                        if (savedRangeRef.current) {
                          const s = window.getSelection()
                          if (s) { s.removeAllRanges(); s.addRange(savedRangeRef.current) }
                        }
                        document.execCommand("insertHTML", false, `<figure style="margin:16px 0"><img src="${url}" style="width:100%;height:260px;object-fit:cover;border-radius:12px" /></figure>`)
                      } catch { alert("Image upload failed") }
                    })()
                    e.target.value = ""
                  }} />
                </label>
              </div>

              {/* Editor */}
              <div
                ref={aboutEditorRef}
                contentEditable
                suppressContentEditableWarning
                data-placeholder="Write about your shop — your story, what you sell, why customers choose you..."
                style={{ fontWeight: "normal" }}
                className="min-h-[220px] px-4 py-4 text-sm text-gray-700 bg-white border border-t-0 border-gray-200 rounded-b-xl outline-none
                  [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-2 [&_h1]:mt-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:mt-3 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-1 [&_h3]:mt-3 [&_p]:text-sm [&_p]:font-normal [&_p]:leading-relaxed
                  [&_p]:mb-3 [&_p]:leading-relaxed [&_p]:font-normal
                  [&_b]:font-bold [&_strong]:font-bold [&_em]:italic
                  [&_figure]:my-4 [&_img]:max-w-full
                  empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none empty:before:font-normal"
              />
            </div>


          </div>
        </main>
      </div>
    </div>
  )
}