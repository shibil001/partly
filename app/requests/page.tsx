"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Search, Plus, X, Car, Wallet, Clock, Trash2, ChevronUp, SlidersHorizontal, Send, Share2 } from "lucide-react"
import QRCode from "qrcode"

interface PartRequest {
  id: string
  user_id: string
  title: string
  description?: string
  budget?: number
  car_make?: string
  car_model?: string
  car_year?: string
  created_at: string
  users?: { full_name: string; username: string; avatar_url?: string }
  image_url?: string
  images?: string[]
  part_name?: string
  variant?: string
  engine?: string
  part_position?: string
  quantity?: string
  oem_number?: string
  condition_preference?: string
  modifications?: string
  location?: string
  delivery?: string
  notes?: string
  expires_at?: string
  is_paid?: boolean
  interest_count?: number
  interested_users?: { user_id: string; full_name: string; username: string; avatar_url?: string }[]
  i_am_interested?: boolean
  status?: string
  bumped_at?: string
}

const MAKES = ["Honda", "Toyota", "Suzuki", "Hyundai", "Mahindra", "Tata", "Ford", "BMW", "Mercedes", "Volkswagen", "Kia", "MG", "Renault", "Nissan", "Other"]
const SORT_OPTIONS = [
  { label: "Latest", value: "latest" },
  { label: "Most Wanted", value: "popular" },
  { label: "Budget: Low to High", value: "budget_asc" },
  { label: "Budget: High to Low", value: "budget_desc" },
]

export default function RequestsPage() {
  const [requests, setRequests] = useState<PartRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [filterMake, setFilterMake] = useState("")
  const [sortBy, setSortBy] = useState("latest")
  const [showFilters, setShowFilters] = useState(false)
  const [budgetMax, setBudgetMax] = useState("")
  const [showMyRequests, setShowMyRequests] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [myRequestCount, setMyRequestCount] = useState<number | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [bumpingId, setBumpingId] = useState<string | null>(null)
  const [bumpMessage, setBumpMessage] = useState<{id: string, msg: string} | null>(null)
  const [markingFound, setMarkingFound] = useState<string | null>(null)
  const [notifyingId, setNotifyingId] = useState<string | null>(null)
  const [notifyMessage, setNotifyMessage] = useState<{id: string, msg: string} | null>(null)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [form, setForm] = useState({
    part_name: "", car_make: "", car_model: "", variant: "", car_year: "",
    engine: "", part_position: "", quantity: "1", oem_number: "",
    condition_preference: "", modifications: "", location: "", delivery: "",
    budget: "", notes: "", images: [] as string[]
  })
  const [formError, setFormError] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<PartRequest | null>(null)
  const [slideIndex, setSlideIndex] = useState(0)
  const [matchingProducts, setMatchingProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  useEffect(() => {
    try { const u = localStorage.getItem("user"); if (u) setCurrentUser(JSON.parse(u)) } catch {}
    fetchRequests()
    // Fetch user's request count
    const token = localStorage.getItem("token")
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/requests/my-count`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => setMyRequestCount(d.count || 0)).catch(() => {})
    }
  }, [])

  const foundCount = requests.filter(r => r.status === 'fulfilled').length
  const placeholders = [
    'Search parts, car make or model...',
    foundCount > 0 ? `${foundCount} people already found their parts here!` : 'Post your request and find sellers fast',
    'What part are you looking for?',
    'Search by part name, brand or car model...',
    requests.length > 0 ? `${requests.length} active part requests right now` : 'Be the first to post a request!',
    'Connect with sellers who have your part...',
  ]


  useEffect(() => { fetchRequests() }, [showMyRequests])
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(i => (i + 1) % placeholders.length)
    }, 30000)
    return () => clearInterval(interval)
  }, [requests.length, foundCount])

  const bumpRequest = async (id: string) => {
    setBumpingId(id)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/requests/${id}/bump`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setBumpMessage({ id, msg: '✓ Bumped!' })
        const bumpTime = new Date().toISOString()
        setRequests(prev => {
          const bumped = prev.find(r => r.id === id)
          if (!bumped) return prev
          const rest = prev.filter(r => r.id !== id)
          return [{ ...bumped, bumped_at: bumpTime }, ...rest]
        })
        setTimeout(() => setBumpMessage(null), 2000)
        setTimeout(() => fetchRequests(), 500)
      } else {
        setBumpMessage({ id, msg: data.error || 'Cannot bump yet' })
        setTimeout(() => setBumpMessage(null), 4000)
      }
    } catch {}
    finally { setBumpingId(null) }
  }

  const markFound = async (id: string) => {
    setMarkingFound(id)
    try {
      const token = localStorage.getItem('token')
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'fulfilled' })
      })
      fetchRequests()
    } catch {}
    finally { setMarkingFound(null) }
  }

  const notifySellers = async (id: string) => {
    setNotifyingId(id)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/requests/${id}/notify-sellers`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      const msg = data.notified > 0 ? `✓ Notified ${data.notified} seller${data.notified > 1 ? 's' : ''}!` : 'No matching sellers found'
      setNotifyMessage({ id, msg })
      setTimeout(() => setNotifyMessage(null), 3000)
    } catch {}
    finally { setNotifyingId(null) }
  }

  const fetchRequests = async () => {
    try {
      const url = showMyRequests && currentUser ? `${process.env.NEXT_PUBLIC_API_URL}/api/requests?show_all=true&user_id=${currentUser.id}` : `${process.env.NEXT_PUBLIC_API_URL}/api/requests`
      const res = await fetch(url)
      const data = await res.json()
      const reqs = (data.requests || []).map((r: any) => ({
        ...r,
        interested_users: r.interested_users || [],
        interest_count: r.interest_count || 0,
        i_am_interested: currentUser ? (r.interested_users || []).some((u: any) => u.user_id === currentUser.id) : false
      }))
      const shuffleArray = (arr: any[]) => {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]]
        }
        return arr
      }
      const bumpedReqs = reqs.filter((r: any) => r.bumped_at && (Date.now() - new Date(r.bumped_at).getTime()) < 4 * 60 * 60 * 1000)
      const restReqs = shuffleArray(reqs.filter((r: any) => !bumpedReqs.find((b: any) => b.id === r.id)))
      setRequests([...bumpedReqs, ...restReqs])
    } catch {}
    finally { setLoading(false) }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setFormError("Image must be under 5MB"); return }
    if (form.images.length >= 3) { setFormError("Maximum 3 images allowed"); return }
    setUploadingImage(true)
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(",")[1])
        reader.readAsDataURL(file)
      })
      const formData = new FormData()
      formData.append("image", base64)
      formData.append("key", "02b4c7432d64053cdaebd47e3a9918ab")
      const res = await fetch("https://api.imgbb.com/1/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (data.success) {
        setForm(f => ({ ...f, images: [...f.images, data.data.url] }))
      } else {
        setFormError("Image upload failed, try again")
      }
    } catch {
      setFormError("Image upload failed, try again")
    } finally {
      setUploadingImage(false)
    }
  }

  const submitRequest = async () => {
    if (!form.part_name.trim()) { setFormError("Part name is required"); return }
    if (!form.car_make.trim()) { setFormError("Vehicle brand is required"); return }
    if (!form.car_model.trim()) { setFormError("Model is required"); return }
    if (!form.budget) { setFormError("Budget is required"); return }
    setFormError(""); setSubmitting(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: form.part_name, ...form, budget: form.budget ? Number(form.budget) : null, image_url: form.images[0] || null })
      })
      if (res.status === 402) {
        setShowModal(false)
        setShowPaymentModal(true)
        return
      }
      if (res.ok) {
        setForm({ part_name: "", car_make: "", car_model: "", variant: "", car_year: "", engine: "", part_position: "", quantity: "1", oem_number: "", condition_preference: "", modifications: "", location: "", delivery: "", budget: "", notes: "", images: [] })
        setShowModal(false)
        setMyRequestCount(c => (c || 0) + 1)
        fetchRequests()
      }
    } catch {}
    finally { setSubmitting(false) }
  }

  const shareRequest = async (req: any) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 1080
      canvas.height = 1920
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // ─── Background ───
      const bg = ctx.createLinearGradient(0, 0, 0, 1920)
      bg.addColorStop(0, '#0a0e1a')
      bg.addColorStop(0.5, '#111827')
      bg.addColorStop(1, '#0a0e1a')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, 1080, 1920)
      const glow = ctx.createRadialGradient(540, 400, 0, 540, 400, 700)
      glow.addColorStop(0, 'rgba(59,130,246,0.18)')
      glow.addColorStop(1, 'rgba(59,130,246,0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, 1080, 1920)
      ctx.strokeStyle = 'rgba(255,255,255,0.025)'
      ctx.lineWidth = 1
      for (let i = 0; i < 1080; i += 60) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,1920); ctx.stroke() }
      for (let i = 0; i < 1920; i += 60) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(1080,i); ctx.stroke() }

      // ─── Logo ───
      ctx.fillStyle = '#3b82f6'
      ctx.beginPath(); ctx.arc(540, 130, 50, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 60px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('P', 540, 134)
      ctx.textBaseline = 'alphabetic'
      ctx.font = 'bold 30px system-ui'; ctx.fillText('PARTLY', 540, 220)
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '20px system-ui'
      ctx.fillText('AUTO PARTS MARKETPLACE', 540, 255)

      // ─── Divider ───
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(280, 290); ctx.lineTo(800, 290); ctx.stroke()

      // ─── PART REQUEST pill ───
      ctx.fillStyle = 'rgba(59,130,246,0.15)'
      ctx.beginPath(); ctx.roundRect(400, 320, 280, 44, 22); ctx.fill()
      ctx.strokeStyle = 'rgba(59,130,246,0.4)'; ctx.stroke()
      ctx.fillStyle = '#60a5fa'; ctx.font = 'bold 20px system-ui'
      ctx.fillText('PART REQUEST', 540, 349)

      // ─── Part name ───
      ctx.fillStyle = '#ffffff'
      const partName = (req.part_name || req.title || 'Part').toUpperCase()
      let fontSize = 96
      ctx.font = `bold ${fontSize}px system-ui`
      while (ctx.measureText(partName).width > 920 && fontSize > 44) { fontSize -= 4; ctx.font = `bold ${fontSize}px system-ui` }
      const words = partName.split(' ')
      const lines: string[] = []
      let cur = ''
      for (const w of words) {
        const t = cur ? cur + ' ' + w : w
        if (ctx.measureText(t).width > 920 && cur) { lines.push(cur); cur = w } else { cur = t }
      }
      if (cur) lines.push(cur)
      let textY = 430 + fontSize
      lines.forEach(l => { ctx.fillText(l, 540, textY); textY += fontSize + 8 })

      // ─── Vehicle ───
      const vehicle = [req.car_make, req.car_model, req.car_year].filter(Boolean).join(' ')
      let detailY = textY + 30
      if (vehicle) {
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '20px system-ui'
        ctx.fillText('FOR VEHICLE', 540, detailY)
        ctx.fillStyle = '#bfdbfe'; ctx.font = 'bold 36px system-ui'
        ctx.fillText(vehicle, 540, detailY + 44)
        detailY += 90
      }

      // ─── Detail rows ───
      const details: {label:string,value:string}[] = []
      if (req.variant) details.push({label:'VARIANT',value:req.variant})
      if (req.engine)  details.push({label:'ENGINE', value:req.engine})
      if (req.part_position) details.push({label:'POSITION',value:req.part_position})
      if (req.oem_number) details.push({label:'OEM NO.',value:req.oem_number})
      if (req.condition_preference && req.condition_preference !== 'any')
        details.push({label:'CONDITION',value:req.condition_preference.toUpperCase()})
      if (req.location) details.push({label:'LOCATION',value:req.location})

      const bottomReserved = 480 // space for image+QR at bottom
      const availableH = 1920 - detailY - bottomReserved - 40
      const maxRows = Math.max(0, Math.floor(availableH / 80))
      let dY = detailY + 20
      details.slice(0, maxRows).forEach(d => {
        ctx.fillStyle = 'rgba(255,255,255,0.04)'
        ctx.beginPath(); ctx.roundRect(180, dY, 720, 68, 14); ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.stroke()
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'left'
        ctx.fillText(d.label, 220, dY + 26)
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 24px system-ui'
        ctx.fillText(d.value.length > 38 ? d.value.slice(0,36)+'...' : d.value, 220, dY + 54)
        dY += 78
      })

      // ─── Bottom: Image (left) + QR (right) side by side ───
      const bottomY = 1920 - bottomReserved + 20
      const boxH = 380
      const imgBoxW = 380, qrBoxW = 560
      const imgBoxX = 60, qrBoxX = 460

      // Cover image box
      const coverUrl = req.image_url || (Array.isArray(req.images) && req.images[0]) || null
      if (coverUrl) {
        try {
          const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const i = new Image(); i.crossOrigin = 'anonymous'
            i.onload = () => resolve(i); i.onerror = reject; i.src = coverUrl
          })
          ctx.save()
          ctx.beginPath(); ctx.roundRect(imgBoxX, bottomY, imgBoxW, boxH, 24); ctx.clip()
          const r = img.width/img.height, br = imgBoxW/boxH
          let dw,dh,dx,dy
          if (r > br) { dh=boxH; dw=boxH*r; dx=imgBoxX-(dw-imgBoxW)/2; dy=bottomY }
          else { dw=imgBoxW; dh=imgBoxW/r; dx=imgBoxX; dy=bottomY-(dh-boxH)/2 }
          ctx.drawImage(img, dx, dy, dw, dh)
          ctx.restore()
          ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 2
          ctx.beginPath(); ctx.roundRect(imgBoxX, bottomY, imgBoxW, boxH, 24); ctx.stroke()
        } catch {
          // No image — draw placeholder
          ctx.fillStyle = 'rgba(255,255,255,0.04)'
          ctx.beginPath(); ctx.roundRect(imgBoxX, bottomY, imgBoxW, boxH, 24); ctx.fill()
          ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = '28px system-ui'; ctx.textAlign = 'center'
          ctx.fillText('No image', imgBoxX + imgBoxW/2, bottomY + boxH/2)
        }
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.04)'
        ctx.beginPath(); ctx.roundRect(imgBoxX, bottomY, imgBoxW, boxH, 24); ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.font = '28px system-ui'; ctx.textAlign = 'center'
        ctx.fillText('No image', imgBoxX + imgBoxW/2, bottomY + boxH/2 + 10)
      }

      // QR code box
      ctx.fillStyle = 'rgba(255,255,255,0.04)'
      ctx.beginPath(); ctx.roundRect(qrBoxX, bottomY, qrBoxW, boxH, 24); ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1; ctx.stroke()

      const shareUrl = `${window.location.origin}/requests?id=${req.id}`
      try {
        const qrDataUrl = await QRCode.toDataURL(shareUrl, {
          width: 220, margin: 1,
          color: { dark: '#ffffff', light: '#00000000' }
        })
        const qrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
          const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = qrDataUrl
        })
        const qrSize = 200
        const qrX = qrBoxX + (qrBoxW - qrSize) / 2
        const qrY = bottomY + 30
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)
      } catch {}

      ctx.textAlign = 'center'
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '18px system-ui'
      ctx.fillText('SCAN TO VIEW ON', qrBoxX + qrBoxW/2, bottomY + 260)
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 28px system-ui'
      ctx.fillText('partly.in', qrBoxX + qrBoxW/2, bottomY + 298)
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '16px system-ui'
      ctx.fillText('or visit partly.in/requests', qrBoxX + qrBoxW/2, bottomY + 330)

      // ─── Blob + share ───
      const blob = await new Promise<Blob|null>(r => canvas.toBlob(r,'image/png',1))
      if (!blob) return
      const file = new File([blob], `partly-request-${req.id}.png`, {type:'image/png'})
      const vehicle2 = [req.car_make,req.car_model,req.car_year].filter(Boolean).join(' ')
      const shareText = `Looking for: ${req.part_name||req.title}${vehicle2?' for '+vehicle2:''} on Partly`

      if (navigator.canShare && navigator.canShare({files:[file]})) {
        try { await navigator.share({files:[file],title:'Partly Request',text:shareText,url:shareUrl}); return }
        catch (e:any) { if (e.name==='AbortError') return }
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href=url; a.download=`partly-request.png`; a.click()
      URL.revokeObjectURL(url)
      try { await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`) } catch {}
      alert('Image downloaded and link copied! Share on Instagram, WhatsApp, or anywhere.')
    } catch (err) {
      console.error('Share failed', err)
    }
  }

  const toggleInterest = async (id: string) => {
    if (!currentUser) { window.location.href = "/login"; return }
    const token = localStorage.getItem("token")

    // Optimistic update immediately
    const meUser = { user_id: currentUser.id, full_name: currentUser.full_name || "", username: currentUser.username || currentUser.email?.split("@")[0] || "user" }
    const applyOptimistic = (r: any) => {
      const alreadyIn = (r.interested_users || []).some((u: any) => u.user_id === currentUser.id)
      const updated = alreadyIn
        ? (r.interested_users || []).filter((u: any) => u.user_id !== currentUser.id)
        : [...(r.interested_users || []), meUser]
      return { ...r, interested_users: updated, interest_count: updated.length, i_am_interested: !alreadyIn }
    }
    setRequests(prev => prev.map(r => r.id === id ? applyOptimistic(r) : r))
    setSelectedRequest(prev => prev && prev.id === id ? applyOptimistic(prev) : prev)

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/requests/${id}/interest`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }
      })
    } catch {}
  }

  const deleteRequest = async (id: string) => {
    const token = localStorage.getItem("token")
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/requests/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` }
      })
      setRequests(prev => prev.filter(r => r.id !== id))
      setConfirmDeleteId(null)
    } catch {}
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  const filtered = requests
    .filter(r => {
      const q = search.toLowerCase()
      const matchSearch = !q || r.title.toLowerCase().includes(q) || r.car_make?.toLowerCase().includes(q) || r.car_model?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)
      const matchMake = !filterMake || r.car_make?.toLowerCase() === filterMake.toLowerCase()
      const matchBudget = !budgetMax || !r.budget || r.budget <= Number(budgetMax)
      const matchMine = !showMyRequests || r.user_id === currentUser?.id
      return matchSearch && matchMake && matchBudget && matchMine
    })
    .filter(req => showMyRequests ? true : req.status !== 'fulfilled')
    .sort((a, b) => {
      if (sortBy === "popular") return (b.interest_count || 0) - (a.interest_count || 0)
      if (sortBy === "budget_asc") return (a.budget || 0) - (b.budget || 0)
      if (sortBy === "budget_desc") return (b.budget || 0) - (a.budget || 0)
      const aTime = a.bumped_at ? new Date(a.bumped_at).getTime() : new Date(a.created_at).getTime()
      const bTime = b.bumped_at ? new Date(b.bumped_at).getTime() : new Date(b.created_at).getTime()
      return bTime - aTime
    })

  const activeFilterCount = [filterMake, budgetMax].filter(Boolean).length

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="w-full px-4 sm:px-6 lg:px-10 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Part Requests</h1>
            <p className="text-sm text-gray-400 mt-0.5">{requests.length} requests from the community</p>
          </div>
          <div className="flex items-start gap-2">
            {currentUser && (
              <button
                onClick={() => setShowMyRequests(v => !v)}
                className={showMyRequests ? "flex items-center gap-2 px-4 py-2.5 border bg-gray-900 text-white border-gray-900 active:scale-95 text-sm font-semibold rounded-xl transition-all" : "flex items-center gap-2 px-4 py-2.5 border bg-white text-gray-700 border-gray-200 hover:bg-gray-50 active:scale-95 text-sm font-semibold rounded-xl transition-all"}
              >
                My Requests
              </button>
            )}
            <div className="flex flex-col items-center gap-0.5">
              <button
                onClick={() => { if (!currentUser) { window.location.href = "/login"; return } setShowModal(true) }}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-700 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all"
              >
                <Plus className="w-4 h-4" /> Post a Request
              </button>
              {currentUser && (
                <p className="text-[10px] text-gray-400">
                  {myRequestCount === null ? "" : myRequestCount < 3 ? `${3 - myRequestCount} free remaining` : "₹10 per request"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Search + Filter bar */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={placeholders[placeholderIndex]}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors ${showFilters || activeFilterCount > 0 ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && <span className="w-5 h-5 rounded-full bg-white text-gray-900 text-[10px] font-bold flex items-center justify-center">{activeFilterCount}</span>}
          </button>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex flex-wrap gap-4">
            <div className="flex-1 min-w-40">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Car Make</label>
              <select
                value={filterMake}
                onChange={e => setFilterMake(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="">All Makes</option>
                {MAKES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-40">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Max Budget (₹)</label>
              <input
                type="number"
                value={budgetMax}
                onChange={e => setBudgetMax(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            {activeFilterCount > 0 && (
              <div className="flex items-end">
                <button onClick={() => { setFilterMake(""); setBudgetMax("") }} className="px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Requests List */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white rounded-xl border border-gray-200 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-200">
            <Car className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="font-medium text-gray-400">{search || activeFilterCount > 0 ? "No requests match your filters" : "No requests yet"}</p>
            <p className="text-sm text-gray-300 mt-1">{!search && !activeFilterCount ? "Be the first to post a part request!" : ""}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
            {filtered.map(req => (
              <div key={req.id} className={`bg-white rounded-xl border overflow-hidden hover:shadow-sm transition-shadow flex flex-col relative group ${showMyRequests && currentUser && req.user_id === currentUser.id ? "h-auto" : "h-56"} ${req.expires_at && new Date(req.expires_at) < new Date() ? "border-red-200 opacity-70" : "border-gray-200"}`}>
                {showMyRequests && currentUser && req.user_id === currentUser.id && (
                  <button onClick={() => setConfirmDeleteId(req.id)}
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white transition-all shadow-sm">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
                {req.image_url ? (
                  <img src={req.image_url} alt="" className="w-full h-28 object-cover" />
                ) : (
                  <div className="w-full h-28 bg-gray-100 flex items-center justify-center">
                    <Car className="w-10 h-10 text-gray-300" />
                  </div>
                )}
                <div className="p-2.5 shrink-0">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-semibold text-gray-900 line-clamp-1 leading-tight flex-1">{req.part_name || req.title}</p>
                    {showMyRequests && req.expires_at && new Date(req.expires_at) < new Date() && (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-red-100 text-red-500 rounded-full shrink-0">Expired</span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 truncate">{[req.car_make, req.car_model].filter(Boolean).join(" ")}</p>
                  <p className="text-[10px] font-semibold text-green-600">₹{Number(req.budget).toLocaleString("en-IN")}</p>
                  <button
                    onClick={async () => {
                        setSelectedRequest(req); setSlideIndex(0); setMatchingProducts([])
                        try {
                          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/requests/${req.id}`)
                          const data = await res.json()
                          if (data.request) setSelectedRequest(prev => prev ? { ...prev, images: data.request.images } : prev)
                        } catch {}
                        // Fetch matching products
                        try {
                          setLoadingProducts(true)
                          const partName = (req.part_name || '').toLowerCase()
                          const carModel = (req.car_model || '').toLowerCase()
                          const carMake = (req.car_make || '').toLowerCase()
                          const searchQuery2 = [partName, carModel, carMake].filter(Boolean).join(' ')

                          // Search via backend
                          const searchQ = encodeURIComponent(searchQuery2)
                          const [ilRes, prodRes] = await Promise.all([
                            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/search?q=${searchQ}&limit=10`),
                            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/search?q=${searchQ}&condition=new&limit=10`)
                          ])
                          const ilJson = await ilRes.json()
                          const prodJson = await prodRes.json()
                          const ilData = (ilJson.products || []).filter((p: any) => p.isIndividualListing)
                          const prodData = (prodJson.products || []).filter((p: any) => !p.isIndividualListing)

                          const matchIL = (ilData || []).map((p: any) => {
                            const haystack = [p.title, p.category, p.brand, p.vehicle_model].filter(Boolean).join(' ').toLowerCase()
                            let score = 0
                            if (partName && haystack.includes(partName)) score += 3
                            if (carModel && haystack.includes(carModel)) score += 2
                            if (carMake && haystack.includes(carMake)) score += 1
                            return { ...p, name: p.title, image: p.images?.[0], _score: score, _type: 'individual' }
                          }).filter((p: any) => p._score >= 2)

                          const matchProd = (prodData || []).map((p: any) => {
                            const haystack = [p.name, p.brand, p.category, p.vehicle_make, p.vehicle_model].filter(Boolean).join(' ').toLowerCase()
                            let score = 0
                            if (partName && haystack.includes(partName)) score += 3
                            if (carModel && haystack.includes(carModel)) score += 2
                            if (carMake && haystack.includes(carMake)) score += 1
                            return { ...p, _score: score, _type: 'product' }
                          }).filter((p: any) => p._score >= 2)

                          const combined = [...matchIL, ...matchProd].sort((a: any, b: any) => b._score - a._score)
                          setMatchingProducts(combined.slice(0, 6).map(({ _score, _type, ...p }: any) => ({ ...p, _type })))
                        } catch {}
                        finally { setLoadingProducts(false) }
                      }}
                    className="mt-1.5 w-full py-1 rounded-lg text-[10px] font-bold bg-gray-100 hover:bg-gray-900 hover:text-white text-gray-600 transition-colors"
                  >
                    View Details
                  </button>
                  {showMyRequests && currentUser && req.user_id === currentUser.id && req.status !== 'fulfilled' && (
                    <div className="flex gap-1 mt-1">
                      {(() => {
                        const lastBump = req.bumped_at ? new Date(req.bumped_at) : null
                        const hoursSince = lastBump ? (Date.now() - lastBump.getTime()) / (1000 * 60 * 60) : 999
                        const canBump = hoursSince >= 4
                        const hoursLeft = lastBump ? Math.ceil(4 - hoursSince) : 0
                        return (
                          <button onClick={() => canBump && bumpRequest(req.id)} disabled={bumpingId === req.id || !canBump}
                            className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-colors ${canBump ? "bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
                            {bumpingId === req.id ? '...' : bumpMessage?.id === req.id ? bumpMessage.msg : canBump ? '↑ Bump' : hoursLeft + 'h left'}
                          </button>
                        )
                      })()}
                      <button onClick={() => markFound(req.id)} disabled={markingFound === req.id}
                        className="flex-1 py-1 rounded-lg text-[10px] font-bold bg-green-50 hover:bg-green-600 hover:text-white text-green-600 transition-colors disabled:opacity-50">
                        {markingFound === req.id ? '...' : 'Found ✓'}
                      </button>
                    </div>
                  )}
                  {showMyRequests && currentUser && req.user_id === currentUser.id && req.status !== 'fulfilled' && (
                    <button onClick={() => notifySellers(req.id)} disabled={notifyingId === req.id}
                      className="mt-1 w-full py-1 rounded-lg text-[10px] font-bold bg-orange-50 hover:bg-orange-500 hover:text-white text-orange-500 transition-colors disabled:opacity-50">
                      {notifyingId === req.id ? 'Notifying...' : notifyMessage?.id === req.id ? notifyMessage.msg : 'Notify Sellers'}
                    </button>
                  )}
                  {req.status === 'fulfilled' && showMyRequests && (
                    <div className="mt-1 w-full py-1 rounded-lg text-[10px] font-bold bg-green-100 text-green-600 text-center">
                      ✓ Part Found
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>


      {/* Post Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl p-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Post a Part Request</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto px-1">
              {/* Vehicle Details */}
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Vehicle Details</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Brand <span className="text-red-500">*</span></label>
                  <input value={form.car_make} onChange={e => setForm(f => ({ ...f, car_make: e.target.value }))} placeholder="e.g. Honda" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Model <span className="text-red-500">*</span></label>
                  <input value={form.car_model} onChange={e => setForm(f => ({ ...f, car_model: e.target.value }))} placeholder="e.g. City" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Variant / Trim</label>
                  <input value={form.variant} onChange={e => setForm(f => ({ ...f, variant: e.target.value }))} placeholder="e.g. ZX, VX" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Year</label>
                  <input value={form.car_year} onChange={e => setForm(f => ({ ...f, car_year: e.target.value }))} placeholder="e.g. 2019" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Engine / CC</label>
                  <input value={form.engine} onChange={e => setForm(f => ({ ...f, engine: e.target.value }))} placeholder="e.g. 1.5L Petrol, 1497cc" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
              </div>

              {/* Part Details */}
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pt-1">Part Details</p>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Part Name *</label>
                <input value={form.part_name} onChange={e => setForm(f => ({ ...f, part_name: e.target.value }))} placeholder="e.g. Front bumper, Headlight assembly" className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 ${formError ? "border-red-300" : "border-gray-200"}`} />
                {formError && <p className="text-xs text-red-500 mt-1">{formError}</p>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Part Position</label>
                  <select value={form.part_position} onChange={e => setForm(f => ({ ...f, part_position: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                    <option value="">Select...</option>
                    <option>Front</option><option>Rear</option><option>Left</option><option>Right</option>
                    <option>Front Left</option><option>Front Right</option><option>Rear Left</option><option>Rear Right</option><option>Centre</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Quantity</label>
                  <input value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="1" type="number" min="1" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">OEM / Part Number</label>
                  <input value={form.oem_number} onChange={e => setForm(f => ({ ...f, oem_number: e.target.value }))} placeholder="Optional" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Condition Preference</label>
                  <select value={form.condition_preference} onChange={e => setForm(f => ({ ...f, condition_preference: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                    <option value="">Any</option>
                    <option>OEM</option><option>Aftermarket</option><option>Used</option><option>New</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Modifications</label>
                <input value={form.modifications} onChange={e => setForm(f => ({ ...f, modifications: e.target.value }))} placeholder="Any modifications to vehicle (if any)" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>

              {/* Delivery & Budget */}
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pt-1">Delivery & Budget</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Location</label>
                  <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="City, Pincode" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Delivery Preference</label>
                  <select value={form.delivery} onChange={e => setForm(f => ({ ...f, delivery: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                    <option value="">Any</option>
                    <option>Shipping</option><option>Pickup</option><option value="Shipping & Pickup">Shipping & Pickup</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Budget (₹) <span className="text-red-500">*</span></label>
                  <input value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="Your budget" type="number" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Additional Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Urgent? Any other details..." rows={2} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Photos (up to 3)</label>
                <div className="grid grid-cols-3 gap-2">
                  {form.images.map((img, i) => (
                    <div key={i} className="relative aspect-square">
                      <img src={img} alt="" className="w-full h-full object-cover rounded-xl border border-gray-200" />
                      <button onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  {form.images.length < 3 && (
                    <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                      <Plus className="w-5 h-5 text-gray-400 mb-1" />
                      <span className="text-[10px] text-gray-400">{uploadingImage ? "Uploading..." : "Add photo"}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={submitRequest} disabled={submitting} className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
                  {submitting ? "Posting..." : "Post Request"}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedRequest(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
            {/* Image Slider */}
            {selectedRequest.image_url && (() => {
              const allImgs = [selectedRequest.image_url, ...((selectedRequest.images as string[] || []).slice(1))]
              return (
                <div className="relative">
                  <div className="relative w-full h-80 bg-gray-50 rounded-t-2xl flex items-center justify-center overflow-hidden border-b border-gray-100 group">
                    <img src={allImgs[slideIndex]} alt="" className="max-w-full max-h-full object-contain" />
                    <button
                      onClick={() => setSelectedRequest(null)}
                      className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {allImgs.length > 1 && (
                    <>
                      <button onClick={() => setSlideIndex(i => (i - 1 + allImgs.length) % allImgs.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors">
                        ‹
                      </button>
                      <button onClick={() => setSlideIndex(i => (i + 1) % allImgs.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors">
                        ›
                      </button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {allImgs.map((_, i) => (
                          <button key={i} onClick={() => setSlideIndex(i)}
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${i === slideIndex ? "bg-white" : "bg-white/50"}`} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )
            })()}
            <div className="p-5 overflow-y-auto">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{(selectedRequest as any).part_name || selectedRequest.title}</h2>
                  <p className="text-sm text-gray-500">{[selectedRequest.car_make, selectedRequest.car_model, (selectedRequest as any).variant, selectedRequest.car_year].filter(Boolean).join(" · ")}</p>
                </div>
                <button
                  onClick={() => toggleInterest(selectedRequest.id)}
                  className={selectedRequest.i_am_interested ? "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-900 text-white border border-gray-900 shrink-0" : "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-gray-700 border border-gray-300 hover:border-gray-900 shrink-0 transition-colors"}
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                  {selectedRequest.interest_count || 0} Interested
                </button>
              </div>



              {/* All details */}
              <div className="space-y-2 mb-4">
                {[
                  { label: "Engine / CC", value: (selectedRequest as any).engine },
                  { label: "Part Position", value: (selectedRequest as any).part_position },
                  { label: "Quantity", value: (selectedRequest as any).quantity },
                  { label: "OEM / Part No.", value: (selectedRequest as any).oem_number },
                  { label: "Condition", value: (selectedRequest as any).condition_preference },
                  { label: "Modifications", value: (selectedRequest as any).modifications },
                  { label: "Location", value: (selectedRequest as any).location },
                  { label: "Delivery", value: (selectedRequest as any).delivery },
                  { label: "Budget", value: selectedRequest.budget ? `₹${Number(selectedRequest.budget).toLocaleString("en-IN")}` : null },
                  { label: "Notes", value: (selectedRequest as any).notes },
                ].filter(item => item.value).map(item => (
                  <div key={item.label} className="flex gap-3 text-sm">
                    <span className="text-gray-400 w-32 shrink-0 text-xs">{item.label}</span>
                    <span className="text-gray-900 font-medium text-xs">{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Poster profile + Message button */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {(selectedRequest.users?.full_name || selectedRequest.users?.username || "A")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{selectedRequest.users?.full_name || selectedRequest.users?.username || "Anonymous"}</p>
                    {selectedRequest.users?.username && <p className="text-[10px] text-gray-400">@{selectedRequest.users.username} · {new Date(selectedRequest.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => shareRequest(selectedRequest)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors shrink-0"
                    title="Share on social media"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </button>
                  {currentUser?.id !== selectedRequest.user_id && (
                    <button
                      onClick={() => {
                        if (!currentUser) { window.location.href = '/login'; return }
                        sessionStorage.setItem('message_draft', JSON.stringify({
                          receiver_id: selectedRequest.user_id,
                          seller_name: selectedRequest.users?.full_name || selectedRequest.users?.username || 'Seller',
                          part_name: (selectedRequest as any).part_name || selectedRequest.title,
                          prefill: `Hi, I saw your request for ${(selectedRequest as any).part_name || selectedRequest.title}. I can help!`
                        }))
                        window.location.href = '/messages'
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-900 hover:bg-gray-700 text-white transition-colors shrink-0"
                    >
                      Message
                    </button>
                  )}
                </div>
              </div>

              {/* Comments */}
              <div className="mt-0">
                <div className="hidden">
                </div>

                {/* Comments */}
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  {((selectedRequest as any).interested_users?.length || 0)} {((selectedRequest as any).interested_users?.length || 0) === 1 ? "person" : "people"} interested
                </p>
                {((selectedRequest as any).interested_users as any[] || []).map((u: any) => (
                  <div key={u.user_id} className="flex items-start gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold shrink-0">
                      {(u.full_name || u.username || "U")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-2xl rounded-tl-sm px-3 py-2">
                      <p className="text-xs font-semibold text-gray-900">{u.full_name || u.username}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-gray-500">
                          <span className="text-blue-500 font-medium">@{u.username || u.full_name || "user"}</span> is also looking for this
                        </p>
                        {u.user_id !== currentUser?.id && (
                          <button
                            onClick={() => {
                              sessionStorage.setItem("message_draft", JSON.stringify({
                                receiver_id: u.user_id,
                                seller_name: u.full_name || u.username || "User",
                                part_name: (selectedRequest as any).part_name || selectedRequest?.title,
                                prefill: `Hi! I have the ${(selectedRequest as any).part_name || selectedRequest?.title} you are looking for. Are you still looking for it?`
                              }))
                              window.location.href = "/messages"
                            }}
                            className="text-[10px] font-semibold text-gray-400 hover:text-gray-900 transition-colors shrink-0 ml-2"
                          >
                            Message
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Matching Products */}
              <div className="border-t border-gray-100 px-5 py-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                  {loadingProducts ? 'Finding matching parts...' : matchingProducts.length > 0 ? `${matchingProducts.length} matching part${matchingProducts.length > 1 ? 's' : ''} available` : 'No matching parts listed yet'}
                </h4>
                {loadingProducts ? (
                  <div className="grid grid-cols-3 gap-2">
                    {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
                  </div>
                ) : matchingProducts.length > 0 ? (
                  <div className="space-y-2">
                    {matchingProducts.slice(0, 6).map((p: any) => (
                      <a key={p.id} href={p._type === "individual" ? `/individual-listing/${p.id}` : `/product/${p.id}`} target="_blank"
                        className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-sm hover:border-gray-300 transition-all group">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                          {p.image || p.images?.[0]
                            ? <img src={p.image || p.images?.[0]} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No img</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 line-clamp-1 group-hover:text-blue-600">{p.name}</p>
                          {p.brand && <p className="text-[10px] text-gray-400">{p.brand}</p>}
                        </div>
                        <p className="text-sm font-bold text-gray-900 shrink-0">₹{Number(p.price).toLocaleString('en-IN')}</p>
                      </a>
                    ))}
                  </div>
                ) : null}
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
              <span className="text-2xl">₹</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Free limit reached</h3>
            <p className="text-sm text-gray-500 mb-2">You've used your 3 free requests.</p>
            <p className="text-sm text-gray-500 mb-5">Each additional request costs <span className="font-bold text-gray-900">₹10</span> and stays active for <span className="font-bold text-gray-900">30 days</span>.</p>
            <button
              className="w-full py-3 bg-gray-900 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors mb-3"
              onClick={() => { setShowPaymentModal(false); alert("Payment coming soon!") }}
            >
              Pay ₹10 & Post Request
            </button>
            <button onClick={() => setShowPaymentModal(false)} className="w-full py-2.5 border border-gray-200 text-sm text-gray-600 rounded-xl hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-bold text-gray-900 mb-2">Delete Request?</h3>
            <p className="text-sm text-gray-500 mb-5">This will permanently remove your part request.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 border border-gray-200 text-sm font-semibold text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => deleteRequest(confirmDeleteId)}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}