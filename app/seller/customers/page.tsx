"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { SellerSidebar } from "@/components/seller/dashboard/shared/sidebar"
import { SellerHeader } from "@/components/seller/dashboard/shared/header"
import { MessageCircle, Tag, Check, X, Clock, RefreshCw, ChevronRight, Send, ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  type: "offer" | "message"
  content: string
  offer_amount?: number
  note?: string
  product_id?: string
  product_name?: string
  product_price?: number
  read: boolean
  status?: "pending" | "accepted" | "declined"
  created_at: string
  buyer?: { full_name: string; username: string; avatar_url?: string } | null
  offer_count?: number
  product_image?: string
}

interface Conversation {
  sender_id: string
  buyer: { full_name: string; username: string; avatar_url?: string } | null
  last_message: string
  last_time: string
  unread: number
  product_name?: string
  product_image?: string
}

// Parse raw DB message into the shape the UI expects
// Realtime delivers raw content (JSON string), API returns parsed — this normalizes both
function clientParseMsg(msg: any): any {
  if (!msg) return msg
  let parsed = null
  try { parsed = JSON.parse(msg.content) } catch {}
  const isOffer = parsed?.type === 'offer'
  const isMsgWithProduct = parsed?.type === 'message' && parsed?.product_id
  return {
    ...msg,
    receiver_id:   msg.recipient_id || msg.receiver_id,
    type:          isOffer ? 'offer' : 'message',
    offer_amount:  isOffer ? parsed.offer_amount : null,
    note:          isOffer ? parsed.note : null,
    product_id:    parsed?.product_id || msg.product_id || null,
    product_name:  parsed?.product_name || msg.product_name || null,
    product_price: parsed?.product_price || msg.product_price || null,
    product_image: parsed?.product_image || msg.product_image || null,
    read:          msg.read_at ? true : (msg.read ?? false),
    status:        msg.status || null,
    content:       isOffer
      ? `Offer: ₹${parsed.offer_amount}${parsed.note ? ` — ${parsed.note}` : ''}`
      : isMsgWithProduct ? parsed.text
      : (msg.content || ''),
  }
}

export default function CustomersPage() {
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"offers" | "messages">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("customers_tab")
      if (saved === "messages") return "messages"
    }
    return "offers"
  })
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Offer history
  const [historyMsg, setHistoryMsg] = useState<Message | null>(null)
  const [history, setHistory] = useState<Message[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // Chat
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null)
  const [chatMessages, setChatMessages] = useState<Message[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [replySending, setReplySending] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [isOtherOnline, setIsOtherOnline] = useState(false)
  const [isOtherTyping, setIsOtherTyping] = useState(false)
  const [lastSeen, setLastSeen] = useState<string | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const presenceChannelRef = useRef<any>(null)
  const sellerId = useRef<string>("")
  const [sellerIdReady, setSellerIdReady] = useState(false)

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("seller_user") || "{}")
      sellerId.current = u.id || ""
      setSellerIdReady(true)
    } catch {}
  }, [])

  const fetchMessages = async (showLoading = true) => {
    if (!showLoading) { /* background refresh */ }
    try {
      const token = localStorage.getItem("seller_token")
      if (!token) { router.push("/seller/login"); return }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/seller`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) return
      const data = await res.json()
      setMessages(data.messages || [])
    } catch {}
    finally { setLoading(false) }
  }

  const fetchHistory = async (msg: Message) => {
    setHistoryMsg(msg)
    setHistoryLoading(true)
    try {
      const token = localStorage.getItem("seller_token")
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/messages/seller/history/${msg.sender_id}/${msg.product_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await res.json()
      setHistory(data.offers || [])
    } catch {}
    finally { setHistoryLoading(false) }
  }

  const openConversation = async (msg: Message) => {
    const convo: Conversation = {
      sender_id: msg.sender_id,
      buyer: msg.buyer || null,
      last_message: msg.content,
      last_time: msg.created_at,
      unread: 0,
      product_name: msg.product_name,
      product_image: (msg as any).product_image,
    }
    setActiveConvo(convo)
    setChatLoading(true)
    try {
      const token = localStorage.getItem("seller_token")
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/messages/conversation/${msg.sender_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await res.json()
      setChatMessages(data.messages || [])
      setMessages(prev => prev.map(m => m.sender_id === msg.sender_id ? { ...m, read: true } : m))
    } catch {}
    finally { setChatLoading(false) }
  }

  useEffect(() => {
    if (!activeConvo || !sellerId.current) return
    if (presenceChannelRef.current) supabase.removeChannel(presenceChannelRef.current)

    const ids = [activeConvo.sender_id, sellerId.current].sort().join('-')
    const channel = supabase.channel(`typing-${ids}`, {
      config: { broadcast: { self: false } }
    })

    channel
      .on('broadcast', { event: 'typing' }, ({ payload }: any) => {
        if (payload.user_id === activeConvo.sender_id) {
          setIsOtherTyping(payload.typing)
        }
      })
      .subscribe()

    presenceChannelRef.current = channel
    return () => { supabase.removeChannel(channel); presenceChannelRef.current = null }
  }, [activeConvo?.sender_id])

  const handleTyping = (val: string) => {
    setReplyText(val)
    if (!presenceChannelRef.current) return
    presenceChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { user_id: sellerId.current, typing: true } })
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      presenceChannelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { user_id: sellerId.current, typing: false } })
    }, 2000)
  }

  const sendReply = async () => {
    if (!replyText.trim() || !activeConvo) return
    setReplySending(true)
    const token = localStorage.getItem("seller_token")
    const tempMsg: Message = {
      id: Date.now().toString(),
      sender_id: sellerId.current,
      receiver_id: activeConvo.sender_id,
      type: "message",
      content: replyText.trim(),
      read: true,
      created_at: new Date().toISOString(),
    }
    setChatMessages(prev => [...prev, tempMsg])
    setReplyText("")
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          receiver_id: activeConvo.sender_id,
          type: "message",
          content: replyText.trim(),
        })
      })
    } catch {}
    finally { setReplySending(false) }
  }

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const prevChatLenRef = useRef(0)

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const el = scrollContainerRef.current
    if (!el) return
    if (behavior === "auto") { el.scrollTop = el.scrollHeight }
    else { el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }) }
  }

  const hasScrolledToBottom = useRef(false)

  // When chat first loads - use ResizeObserver to scroll after content renders
  useEffect(() => {
    if (chatLoading) { hasScrolledToBottom.current = false; return }
    if (chatMessages.length === 0) return
    const el = scrollContainerRef.current
    if (!el) return
    // Already scrolled for this convo
    if (hasScrolledToBottom.current) return
    const observer = new ResizeObserver(() => {
      el.scrollTop = el.scrollHeight
      hasScrolledToBottom.current = true
      observer.disconnect()
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [chatLoading, chatMessages.length])

  // New message while chat is open - only scroll if near bottom
  useEffect(() => {
    if (!hasScrolledToBottom.current) return
    if (chatMessages.length > prevChatLenRef.current) {
      const el = scrollContainerRef.current
      if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 150) {
        scrollToBottom("smooth")
      }
    }
    prevChatLenRef.current = chatMessages.length
  }, [chatMessages.length])

  useEffect(() => {
    prevChatLenRef.current = 0
    hasScrolledToBottom.current = false
  }, [activeConvo?.sender_id])

  useEffect(() => { fetchMessages() }, [])

  // Realtime: listen for new messages in active chat
  useEffect(() => {
    if (!activeConvo || !sellerIdReady) return
    const uid = sellerId.current
    const senderId = activeConvo.sender_id
    if (!uid) return
    const channel = supabase
      .channel(`seller-chat-${senderId}-${uid}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const raw = payload.new as any
        const msg = clientParseMsg(raw)
        // Only handle messages for this conversation
        if (msg.recipient_id === uid && msg.sender_id === senderId) {
          setChatMessages(prev => [...prev, msg])
        }
        if (msg.recipient_id === uid || msg.sender_id === uid) {
          fetchMessages(false)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [activeConvo?.sender_id, sellerIdReady])

  // Realtime: listen for any new incoming messages (refresh list)
  useEffect(() => {
    if (!sellerIdReady) return
    const sellerIdVal = sellerId.current
    if (!sellerIdVal) return
    const channel = supabase
      .channel(`seller-inbox-${sellerIdVal}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const msg = payload.new as any
        if (msg.recipient_id === sellerIdVal || msg.sender_id === sellerIdVal) {
          fetchMessages(false)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [sellerIdReady])

  const markRead = async (id: string) => {
    try {
      const token = localStorage.getItem("seller_token")
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/${id}/read`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }
      })
      setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m))
    } catch {}
  }

  const updateStatus = async (id: string, status: "accepted" | "declined") => {
    setActionLoading(id + status)
    try {
      const token = localStorage.getItem("seller_token")
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      })
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status, read: true } : m))
      setChatMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m))
      if (historyMsg?.id === id) setHistoryMsg(prev => prev ? { ...prev, status } : null)
    } catch {}
    finally { setActionLoading(null) }
  }

  const filtered = messages.filter(m =>
    activeTab === "offers" ? m.type === "offer" : m.type === "message"
  )

  // Group messages by sender for the Messages tab
  const conversations = filtered.reduce((acc: Record<string, Message>, msg) => {
    if (!acc[msg.sender_id] || new Date(msg.created_at) > new Date(acc[msg.sender_id].created_at)) {
      acc[msg.sender_id] = msg
    }
    return acc
  }, {})
  const conversationList = Object.values(conversations).sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const unreadCount = messages.filter(m => !m.read).length
  const offerCount = messages.filter(m => m.type === "offer").length
  const pendingOffers = messages.filter(m => m.type === "offer" && !m.status).length


  const buyerName = (msg: Message) => msg.buyer?.full_name || msg.buyer?.username || "Buyer"

  return (
    <div className="flex h-screen bg-gray-50">
      <SellerSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <SellerHeader />
        <div className="flex-1 overflow-hidden flex">

          {/* Left Panel */}
          <div className={`${activeConvo ? "hidden md:flex" : "flex"} flex-col flex-1 overflow-hidden`}>
            <div className="p-6 pb-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Customers</h1>
                  <p className="text-sm text-gray-400 mt-0.5">Offers and messages from buyers</p>
                </div>
                <button onClick={() => fetchMessages()} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-4">
                <button
                  onClick={() => { setActiveTab("offers"); setActiveConvo(null); localStorage.setItem("customers_tab", "offers") }}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition-colors ${activeTab === "offers" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                >
                  Offers
                  {messages.filter(m => m.type === "offer" && !m.status).length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center font-bold">
                      {messages.filter(m => m.type === "offer" && !m.status).length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => { setActiveTab("messages"); setActiveConvo(null); localStorage.setItem("customers_tab", "messages") }}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition-colors ${activeTab === "messages" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                >
                  Messages
                  {messages.filter(m => m.type === "message" && !m.read).length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold">
                      {messages.filter(m => m.type === "message" && !m.read).length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {loading ? (
                <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-xl border border-gray-200 h-20 animate-pulse" />)}</div>
              ) : activeTab === "messages" ? (
                /* Conversation list for messages */
                conversationList.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 py-16 flex flex-col items-center gap-3">
                    <MessageCircle className="w-10 h-10 text-gray-200" />
                    <p className="text-sm text-gray-400">No messages yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversationList.map(msg => (
                      <button key={msg.sender_id} onClick={() => openConversation(msg)}
                        className={`w-full bg-white rounded-xl border text-left transition-all hover:shadow-sm ${!msg.read ? "border-blue-200" : "border-gray-200"} ${activeConvo?.sender_id === msg.sender_id ? "ring-2 ring-gray-900" : ""}`}
                      >
                        <div className="p-3 flex items-center gap-3">
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center shrink-0 text-white text-sm font-bold overflow-hidden">
                            {msg.buyer?.avatar_url
                              ? <img src={msg.buyer.avatar_url} alt="" className="w-full h-full object-cover" />
                              : buyerName(msg)[0]?.toUpperCase()
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-gray-900">{buyerName(msg)}</span>
                              <span className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                            <p className="text-xs text-gray-400 truncate">{msg.content}</p>
                          </div>
                          {!msg.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                        </div>
                      </button>
                    ))}
                  </div>
                )
              ) : (
                /* Offers list */
                filtered.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 py-16 flex flex-col items-center gap-3">
                    <Tag className="w-10 h-10 text-gray-200" />
                    <p className="text-sm text-gray-400">No offers yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filtered.map(msg => (
                      <div key={msg.id}
                        className={`bg-white rounded-xl border transition-all ${!msg.read ? "border-blue-200 shadow-sm" : "border-gray-200"}`}
                        onClick={() => { if (!msg.read) markRead(msg.id) }}
                      >
                        <div className="p-4 flex flex-row items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200 flex items-center justify-center">
                            {(msg as any).product_image ? (
                              <img src={(msg as any).product_image} alt={msg.product_name || ""} className="w-full h-full object-cover" />
                            ) : <Tag className="w-4 h-4 text-gray-300" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              {!msg.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                              {msg.status === "accepted" && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-green-100 text-green-700">Accepted</span>}
                              {msg.status === "declined" && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-600">Declined</span>}
                            </div>
                            {msg.product_name && <p className="text-xs font-semibold text-gray-800 truncate">{msg.product_name}</p>}
                            <div className="flex items-center gap-2 mt-0.5 mb-1">
                              <p className="text-xs text-gray-400">{buyerName(msg)}</p>
                              {msg.offer_count && msg.offer_count > 1 && (
                                <button onClick={e => { e.stopPropagation(); fetchHistory(msg) }}
                                  className="text-[10px] bg-orange-100 text-orange-600 font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 hover:bg-orange-200 transition-colors">
                                  {msg.offer_count} offers <ChevronRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            {msg.offer_amount && (
                              <div className="flex items-center gap-2">
                                <span className="text-base font-bold text-gray-900">₹{msg.offer_amount.toLocaleString("en-IN")}</span>
                                {msg.product_price && <span className="text-xs text-gray-400 line-through">₹{msg.product_price.toLocaleString("en-IN")}</span>}
                                {msg.product_price && msg.offer_amount < msg.product_price && (
                                  <span className={`text-xs font-semibold ${msg.offer_amount < msg.product_price * 0.8 ? "text-red-500" : "text-green-600"}`}>
                                    {Math.round((1 - msg.offer_amount / msg.product_price) * 100)}% off
                                  </span>
                                )}
                                {msg.product_price && msg.offer_amount >= msg.product_price && (
                                  <span className="text-xs font-semibold text-green-600">above asking</span>
                                )}
                              </div>
                            )}
                            {msg.note && <p className="text-xs text-gray-500 mt-1">{msg.note}</p>}
                          </div>
                          <div className="shrink-0 self-center flex flex-col items-center gap-1.5 ml-2">
                            <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(msg.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                            <button onClick={e => { e.stopPropagation(); openConversation(msg) }}
                              className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-900 px-3 py-2 rounded-xl transition-colors whitespace-nowrap">
                              <MessageCircle className="w-3.5 h-3.5" /> Chat
                            </button>
                          </div>
                        </div>
                        <div className="px-4 pb-4 flex gap-2">
                          {msg.type === "offer" && !msg.status && (
                            <>
                              <button onClick={e => { e.stopPropagation(); updateStatus(msg.id, "accepted") }}
                                disabled={actionLoading === msg.id + "accepted"}
                                className="flex-1 h-9 flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-gray-800 active:scale-95 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all disabled:opacity-50">
                                <Check className="w-3.5 h-3.5" />{actionLoading === msg.id + "accepted" ? "..." : "Accept"}
                              </button>
                              <button onClick={e => { e.stopPropagation(); updateStatus(msg.id, "declined") }}
                                disabled={actionLoading === msg.id + "declined"}
                                className="flex-1 h-9 flex items-center justify-center gap-1.5 border-2 border-gray-200 hover:border-gray-300 active:scale-95 text-gray-600 text-xs font-bold uppercase tracking-wider rounded-xl transition-all disabled:opacity-50">
                                <X className="w-3.5 h-3.5" />{actionLoading === msg.id + "declined" ? "..." : "Decline"}
                              </button>
                            </>
                          )}

                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>

        </div>

      {/* Chat Modal */}
      {activeConvo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setActiveConvo(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-4xl" style={{ height: "90vh" }}>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 shrink-0">
              <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
                {activeConvo.buyer?.avatar_url
                  ? <img src={activeConvo.buyer.avatar_url} alt="" className="w-full h-full object-cover" />
                  : (activeConvo.buyer?.full_name || activeConvo.buyer?.username || "B")[0].toUpperCase()
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900">{activeConvo.buyer?.full_name || activeConvo.buyer?.username || "Buyer"}</p>
                {isOtherTyping && (
                  <p className="text-xs text-blue-500 font-medium animate-pulse">typing...</p>
                )}
              </div>
              <button onClick={() => setActiveConvo(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50">

              {chatLoading ? (
                <div className="flex justify-center pt-10"><div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" /></div>
              ) : chatMessages.map(msg => {
                const isMine = msg.sender_id === sellerId.current
                const msgDate = new Date(msg.created_at).toDateString()
                const msgIdx = chatMessages.indexOf(msg)
                const prevDate = msgIdx > 0 ? new Date(chatMessages[msgIdx - 1].created_at).toDateString() : null
                const showDate = msgDate !== prevDate
                const dateLabel = (() => {
                  const d = new Date(msg.created_at)
                  const today = new Date()
                  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1)
                  if (d.toDateString() === today.toDateString()) return "Today"
                  if (d.toDateString() === yesterday.toDateString()) return "Yesterday"
                  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                })()
                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="flex items-center gap-2 my-3">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-2">{dateLabel}</span>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>
                    )}
                    <div className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
                    {!isMine && (
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0 overflow-hidden">
                        {activeConvo.buyer?.avatar_url
                          ? <img src={activeConvo.buyer.avatar_url} alt="" className="w-full h-full object-cover" />
                          : (activeConvo.buyer?.full_name || "B")[0].toUpperCase()
                        }
                      </div>
                    )}
                    {msg.type === "offer" ? (
                      <div className="max-w-[80%] rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
                        {/* Product row */}
                        {(msg.product_name || activeConvo.product_name) && (
                          <div className="flex items-center gap-2 px-3 pt-3 pb-2 border-b border-gray-100">
                            {((msg as any).product_image || activeConvo.product_image) && (
                              <img src={(msg as any).product_image || activeConvo.product_image} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 border border-gray-100" />
                            )}
                            <p className="text-xs font-semibold text-gray-700 truncate">{msg.product_name || activeConvo.product_name}</p>
                          </div>
                        )}
                        {/* Offer amount */}
                        <div className="px-3 pt-2 pb-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-lg font-bold text-gray-900">₹{(msg as any).offer_amount?.toLocaleString("en-IN")}</span>
                            {(msg as any).product_price && (
                              <span className="text-xs text-gray-400 line-through">₹{(msg as any).product_price?.toLocaleString("en-IN")}</span>
                            )}
                            {(msg as any).product_price && (msg as any).offer_amount < (msg as any).product_price && (
                              <span className={`text-xs font-semibold ${(msg as any).offer_amount < (msg as any).product_price * 0.8 ? "text-red-500" : "text-green-600"}`}>
                                {Math.round((1 - (msg as any).offer_amount / (msg as any).product_price) * 100)}% off
                              </span>
                            )}
                            {(msg as any).product_price && (msg as any).offer_amount >= (msg as any).product_price && (
                              <span className="text-xs font-semibold text-green-600">above asking</span>
                            )}
                          </div>
                          {(msg as any).note && <p className="text-xs text-gray-500 mb-1">{(msg as any).note}</p>}
                          <p className="text-[10px] text-gray-400 pb-1">
                            {new Date(msg.created_at).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        {/* Accept/Decline if pending and not mine */}
                        {!isMine && !(msg as any).status && (
                          <div className="flex gap-2 px-3 pb-3">
                            <button onClick={() => updateStatus(msg.id, "accepted")} disabled={!!actionLoading}
                              className="flex-1 h-8 flex items-center justify-center gap-1 bg-gray-900 hover:bg-gray-800 active:scale-95 text-white text-[10px] font-bold uppercase rounded-xl transition-all">
                              <Check className="w-3 h-3" /> Accept
                            </button>
                            <button onClick={() => updateStatus(msg.id, "declined")} disabled={!!actionLoading}
                              className="flex-1 h-8 flex items-center justify-center gap-1 border border-gray-200 hover:border-gray-400 active:scale-95 text-gray-600 text-[10px] font-bold uppercase rounded-xl transition-all">
                              <X className="w-3 h-3" /> Decline
                            </button>
                          </div>
                        )}
                        {!isMine && (msg as any).status === "accepted" && (
                          <div className="px-3 pb-3"><span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-green-100 text-green-700">Accepted</span></div>
                        )}
                        {!isMine && (msg as any).status === "declined" && (
                          <div className="px-3 pb-3"><span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-600">Declined</span></div>
                        )}
                      </div>
                    ) : !isMine && msg.product_name ? (
                      <div className="max-w-[80%] rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center gap-2 px-3 pt-3 pb-2 border-b border-gray-100">
                          {(msg as any).product_image && <img src={(msg as any).product_image} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />}
                          <p className="text-xs font-semibold text-gray-800 truncate">{msg.product_name}</p>
                        </div>
                        <div className="px-3 py-2.5">
                          <p className="text-sm text-gray-900">{msg.content}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{new Date(msg.created_at).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                      </div>
                    ) : (
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${isMine ? "bg-gray-900 text-white rounded-br-sm" : "bg-white text-gray-900 rounded-bl-sm shadow-sm"}`}>
                        <p className="text-sm leading-relaxed">{msg.content || (msg as any).note}</p>
                        <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
                          <p className="text-[10px] text-gray-400">{new Date(msg.created_at).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                      </div>
                    )}
                    </div>
                  </div>
                )
              })}
              <div ref={chatEndRef} />
            </div>
            <div className="px-5 py-4 border-t border-gray-200 shrink-0">
              <div className="flex items-end gap-3 bg-gray-100 rounded-2xl px-4 py-2">
                <textarea
                  value={replyText}
                  onChange={e => handleTyping(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                  placeholder="Reply..."
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-gray-900 outline-none resize-none placeholder-gray-400 max-h-28 py-1"
                />
                <button onClick={sendReply} disabled={!replyText.trim() || replySending}
                  className="w-9 h-9 bg-gray-900 hover:bg-gray-700 disabled:opacity-40 rounded-full flex items-center justify-center transition-colors shrink-0">
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Offer History Drawer */}
      {historyMsg && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setHistoryMsg(null)} />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Offer History</h2>
                <p className="text-xs text-gray-400 mt-0.5">{buyerName(historyMsg)} · {historyMsg.product_name}</p>
              </div>
              <button onClick={() => setHistoryMsg(null)} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">
                <X className="w-3.5 h-3.5 text-gray-600" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {historyLoading ? (
                <div className="py-8 flex justify-center"><div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" /></div>
              ) : history.map((offer, idx) => (
                <div key={offer.id} className={`rounded-xl border p-4 ${idx === 0 ? "border-gray-900 bg-gray-50" : "border-gray-200"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-gray-900">₹{offer.offer_amount?.toLocaleString("en-IN")}</span>
                      {idx === 0 && <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-gray-900 text-white rounded-full">Latest</span>}
                    </div>
                    <span className="text-xs text-gray-400">{new Date(offer.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  {offer.note && <p className="text-xs text-gray-500 mb-2">{offer.note}</p>}
                  {offer.status === "accepted" && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-green-100 text-green-700">Accepted</span>}
                  {offer.status === "declined" && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-600">Declined</span>}
                  {!offer.status && idx === 0 && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => updateStatus(offer.id, "accepted")} disabled={!!actionLoading}
                        className="flex-1 h-8 flex items-center justify-center gap-1 bg-gray-900 hover:bg-gray-800 active:scale-95 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all disabled:opacity-50">
                        <Check className="w-3 h-3" /> Accept
                      </button>
                      <button onClick={() => updateStatus(offer.id, "declined")} disabled={!!actionLoading}
                        className="flex-1 h-8 flex items-center justify-center gap-1 border border-gray-200 hover:border-gray-400 active:scale-95 text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all disabled:opacity-50">
                        <X className="w-3 h-3" /> Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}