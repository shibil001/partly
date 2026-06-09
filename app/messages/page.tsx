"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { MessageCircle, Send, X, ArrowLeft, Home } from "lucide-react"
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
  product_image?: string
  read: boolean
  status?: "pending" | "accepted" | "declined"
  created_at: string
  seller_id?: string
  shop?: { shop_name: string; shop_username: string; logo_url?: string } | null
}

interface Conversation {
  seller_id: string
  shop: { shop_name: string; shop_username: string; logo_url?: string } | null
  content: string
  created_at: string
  product_name?: string
  product_image?: string
  unread: number
}

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

export default function BuyerMessagesPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null)
  const [chatMessages, setChatMessages] = useState<Message[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [replySending, setReplySending] = useState(false)
  const [isOtherOnline, setIsOtherOnline] = useState(false)
  const [isOtherTyping, setIsOtherTyping] = useState(false)
  const [lastSeen, setLastSeen] = useState<string | null>(null)

  const buyerId = useRef<string>("")
  const [buyerIdReady, setBuyerIdReady] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const presenceChannelRef = useRef<any>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasScrolledToBottom = useRef(false)
  const prevChatLenRef = useRef(0)

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}")
      if (!u.id) { router.push("/login"); return }
      buyerId.current = u.id
      setBuyerIdReady(true)
    } catch { router.push("/login") }
  }, [])

  const fetchConversations = async (showLoading = true) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) { router.push("/login"); return }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/buyer`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) return
      const data = await res.json()
      setConversations(data.conversations || [])
    } catch {}
    finally { if (showLoading) setLoading(false) }
  }

  const openConversation = async (msg: Message) => {
    const sellerId = msg.seller_id || (msg.sender_id === buyerId.current ? (msg as any).recipient_id || msg.receiver_id : msg.sender_id)
    const convo: Conversation = {
      seller_id: sellerId,
      shop: msg.shop || null,
      content: msg.content,
      created_at: msg.created_at,
      product_name: msg.product_name,
      product_image: msg.product_image,
      unread: 0,
    }
    setActiveConvo(convo)
    setChatLoading(true)
    hasScrolledToBottom.current = false
    prevChatLenRef.current = 0
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/messages/conversation/${sellerId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await res.json()
      setChatMessages(data.messages || [])
      setConversations(prev => prev.map(m => {
        const id = m.seller_id || (m.sender_id === buyerId.current ? (m as any).recipient_id || m.receiver_id : m.sender_id)
        return id === sellerId ? { ...m, read: true, unread: 0 } as any : m
      }))
    } catch {}
    finally { setChatLoading(false) }
  }

  // Presence
  useEffect(() => {
    if (!activeConvo || !buyerId.current) return
    if (presenceChannelRef.current) supabase.removeChannel(presenceChannelRef.current)
    const ids = [buyerId.current, activeConvo.seller_id].sort().join("-")
    const channel = supabase.channel(`typing-${ids}`, {
      config: { broadcast: { self: false } }
    })
    channel
      .on("broadcast", { event: "typing" }, ({ payload }: any) => {
        if (payload.user_id === activeConvo.seller_id) {
          setIsOtherTyping(payload.typing)
        }
      })
      .subscribe()
    presenceChannelRef.current = channel
    return () => { supabase.removeChannel(channel); presenceChannelRef.current = null }
  }, [activeConvo?.seller_id])

  const handleTyping = (val: string) => {
    setReplyText(val)
    if (!presenceChannelRef.current) return
    presenceChannelRef.current.send({ type: "broadcast", event: "typing", payload: { user_id: buyerId.current, typing: true } })
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      presenceChannelRef.current?.send({ type: "broadcast", event: "typing", payload: { user_id: buyerId.current, typing: false } })
    }, 2000)
  }

  const sendReply = async () => {
    if (!replyText.trim() || !activeConvo) return
    setReplySending(true)
    const token = localStorage.getItem("token")
    const tempMsg: Message = {
      id: Date.now().toString(),
      sender_id: buyerId.current,
      receiver_id: activeConvo.seller_id,
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
          receiver_id: activeConvo.seller_id,
          type: "message",
          content: replyText.trim(),
        })
      })
    } catch {}
    finally { setReplySending(false) }
  }

  // Scroll on first load
  useEffect(() => {
    if (chatLoading) { hasScrolledToBottom.current = false; return }
    if (chatMessages.length === 0) return
    const el = scrollContainerRef.current
    if (!el || hasScrolledToBottom.current) return
    const observer = new ResizeObserver(() => {
      el.scrollTop = el.scrollHeight
      hasScrolledToBottom.current = true
      observer.disconnect()
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [chatLoading, chatMessages.length])

  // Scroll on new message
  useEffect(() => {
    if (!hasScrolledToBottom.current) return
    if (chatMessages.length > prevChatLenRef.current) {
      const el = scrollContainerRef.current
      if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 150) {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
      }
    }
    prevChatLenRef.current = chatMessages.length
  }, [chatMessages.length])

  useEffect(() => {
    prevChatLenRef.current = 0
    hasScrolledToBottom.current = false
  }, [activeConvo?.seller_id])

  useEffect(() => { fetchConversations() }, [])

  // Handle pre-filled draft from requests page
  useEffect(() => {
    try {
      const draft = sessionStorage.getItem('message_draft')
      if (!draft) return
      const { receiver_id, seller_name, part_name, prefill } = JSON.parse(draft)
      sessionStorage.setItem('chat_name_' + receiver_id, seller_name)
      sessionStorage.removeItem('message_draft')
      if (receiver_id) {
        setActiveConvo({
          seller_id: receiver_id,
          shop: { shop_name: seller_name, shop_username: seller_name },
          content: '',
          created_at: new Date().toISOString(),
          product_name: part_name,
          unread: 0,
        })
        if (prefill) setReplyText(prefill)
        // Load conversation
        const token = localStorage.getItem('token')
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/conversation/${receiver_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()).then(d => setChatMessages(d.messages || [])).catch(() => {})
      }
    } catch {}
  }, [])

  // Realtime: new messages in active chat
  useEffect(() => {
    if (!activeConvo || !buyerIdReady) return
    const uid = buyerId.current
    if (!uid) return
    const channel = supabase
      .channel(`buyer-chat-${activeConvo.seller_id}-${uid}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
      }, (payload) => {
        const raw = payload.new as any
        const msg = clientParseMsg(raw)
        if (msg.recipient_id === uid && msg.sender_id === activeConvo.seller_id) {
          setChatMessages(prev => [...prev, msg])
        }
        if (msg.sender_id === uid && msg.recipient_id === activeConvo.seller_id) {
          setChatMessages(prev => {
            const exists = prev.some(m => m.content === msg.content && Math.abs(new Date(m.created_at).getTime() - new Date(msg.created_at).getTime()) < 5000)
            return exists ? prev.map(m => m.content === msg.content ? { ...m, id: msg.id } : m) : [...prev, msg]
          })
        }
        if (msg.recipient_id === uid || msg.sender_id === uid) {
          fetchConversations(false)
        }
      })
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "messages",
      }, (payload) => {
        const msg = clientParseMsg(payload.new as any)
        if (msg.sender_id === uid || msg.recipient_id === uid) {
          setChatMessages(prev => prev.map(m => m.id === msg.id ? { ...m, ...msg } : m))
          fetchConversations(false)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [activeConvo?.seller_id, buyerIdReady])

  // Realtime: inbox refresh
  useEffect(() => {
    if (!buyerIdReady) return
    const uid = buyerId.current
    if (!uid) return
    const channel = supabase
      .channel(`buyer-inbox-${uid}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "messages",
      }, (payload) => {
        const msg = payload.new as any
        if (msg?.recipient_id === uid || msg?.sender_id === uid) {
          fetchConversations(false)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [buyerIdReady])

  // Poll for new messages when chat is open (catches messages sent from product page)


  const shopName = (msg: Message) => { const sid = msg.seller_id || (msg.sender_id === buyerId.current ? (msg as any).recipient_id || msg.receiver_id : msg.sender_id); return msg.shop?.shop_name || msg.shop?.shop_username || sessionStorage.getItem("chat_name_" + sid) || "User" }

  return (
    <div className="flex h-screen bg-white">

      {/* Sidebar */}
      <div className={`${activeConvo ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 border-r border-gray-200 shrink-0`}>
        <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={() => router.push("/")} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
              <Home className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <h1 className="text-lg font-bold text-gray-900">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <MessageCircle className="w-10 h-10 text-gray-200" />
              <p className="text-sm text-gray-400">No messages yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {conversations.map((msg, i) => {
                const sid = msg.seller_id || (msg.sender_id === buyerId.current ? (msg as any).recipient_id || msg.receiver_id : msg.sender_id)
                const isActive = activeConvo?.seller_id === sid
                const hasUnread = (msg as any).unread > 0
                return (
                  <button key={sid || i} onClick={() => openConversation(msg)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors hover:bg-gray-50 ${isActive ? "bg-gray-100" : ""}`}
                  >
                    <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden bg-gray-900 flex items-center justify-center text-white text-sm font-bold">
                      {msg.shop?.logo_url
                        ? <img src={msg.shop.logo_url} alt="" className="w-full h-full object-cover" />
                        : shopName(msg)[0]?.toUpperCase()
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm truncate ${hasUnread ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}>{shopName(msg)}</span>
                        <span className="text-xs text-gray-400 shrink-0 ml-2">{new Date(msg.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short" })}</span>
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${hasUnread ? "text-gray-800 font-medium" : "text-gray-400"}`}>{msg.content || (msg as any).note || ""}</p>
                    </div>
                    {hasUnread && (
                      <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold shrink-0">
                        {(msg as any).unread}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      {activeConvo ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 shrink-0">
            <button onClick={() => setActiveConvo(null)} className="md:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <div className="shrink-0">
              <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                {activeConvo.shop?.logo_url
                  ? <img src={activeConvo.shop.logo_url} alt="" className="w-full h-full object-cover" />
                  : (activeConvo.shop?.shop_name || sessionStorage.getItem("chat_name_" + activeConvo.seller_id) || "U")[0].toUpperCase()
                }
              </div>

            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm">{activeConvo.shop?.shop_name || activeConvo.shop?.shop_username || sessionStorage.getItem("chat_name_" + activeConvo.seller_id) || "User"}</p>
              {isOtherTyping && (
                <p className="text-xs text-blue-500 font-medium animate-pulse">typing...</p>
              )}
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
            {chatLoading ? (
              <div className="flex justify-center pt-10">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
              </div>
            ) : chatMessages.map((msg, msgIdx) => {
              const isMine = msg.sender_id === buyerId.current
              const msgDate = new Date(msg.created_at).toDateString()
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
                <div key={msg.id + "-" + msgIdx}>
                  {showDate && (
                    <div className="flex items-center gap-2 my-3">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-2">{dateLabel}</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                  )}
                  <div className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
                    {!isMine && (
                      <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0 overflow-hidden">
                        {activeConvo.shop?.logo_url
                          ? <img src={activeConvo.shop.logo_url} alt="" className="w-full h-full object-cover" />
                          : (activeConvo.shop?.shop_name || sessionStorage.getItem("chat_name_" + activeConvo.seller_id) || "U")[0].toUpperCase()
                        }
                      </div>
                    )}
                    {msg.type === "offer" ? (
                      <div className="max-w-[80%] rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
                        {msg.product_name && (
                          <div className="flex items-center gap-2 px-3 pt-3 pb-2 border-b border-gray-100">
                            {msg.product_image && <img src={msg.product_image} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />}
                            <p className="text-xs font-semibold text-gray-700 truncate">{msg.product_name}</p>
                          </div>
                        )}
                        <div className="px-3 pt-2 pb-3">
                          <span className="text-lg font-bold text-gray-900">₹{msg.offer_amount?.toLocaleString("en-IN")}</span>
                          {msg.product_price && <span className="text-xs text-gray-400 line-through ml-2">₹{msg.product_price.toLocaleString("en-IN")}</span>}
                          {msg.note && <p className="text-xs text-gray-500 mt-1">{msg.note}</p>}
                          <p className="text-[10px] text-gray-400 mt-1">{new Date(msg.created_at).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                          {msg.status === "accepted" && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-green-100 text-green-700 mt-1 inline-block">Accepted</span>}
                          {msg.status === "declined" && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-600 mt-1 inline-block">Declined</span>}
                        </div>
                      </div>
                    ) : msg.product_name && msg.product_id ? (
                      <div className="max-w-[80%] rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center gap-2 px-3 pt-3 pb-2 border-b border-gray-100">
                          {msg.product_image && <img src={msg.product_image} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />}
                          <p className="text-xs font-semibold text-gray-800 truncate">{msg.product_name}</p>
                        </div>
                        <div className="px-3 py-2.5">
                          <p className="text-sm text-gray-900 whitespace-pre-line">{msg.content}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{new Date(msg.created_at).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                      </div>
                    ) : (
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${isMine ? "bg-gray-900 text-white rounded-br-sm" : "bg-white text-gray-900 rounded-bl-sm shadow-sm"}`}>
                        <p className="text-sm leading-relaxed">{msg.content || (msg as any).note || ""}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? "text-gray-400 text-right" : "text-gray-400"}`}>
                          {new Date(msg.created_at).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-gray-200 bg-white shrink-0">
            <div className="flex items-end gap-3 bg-gray-100 rounded-2xl px-4 py-2">
              <textarea
                value={replyText}
                onChange={e => handleTyping(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                placeholder="Message..."
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
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Select a conversation</p>
          </div>
        </div>
      )}
    </div>
  )
}