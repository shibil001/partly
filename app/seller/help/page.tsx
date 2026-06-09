"use client"

import { useState, useEffect, useRef } from "react"
import { Send, MessageCircle, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Clock } from "lucide-react"

const SUPPORT_USER_ID = process.env.NEXT_PUBLIC_SUPPORT_USER_ID || 'partly_support'

const FAQS = [
  { q: "How do I get my shop approved?", a: "After registration, our team reviews your application within 1-2 working days. Make sure your KYC documents are complete and accurate." },
  { q: "When do I get paid?", a: "Payouts are processed every Monday. Funds are released 14 days after delivery to protect buyers. You can track your payout status in the Payouts section." },
  { q: "How do commissions work?", a: "Commission is tiered: 10% for orders under ₹500, 8% for ₹500–₹2,000, 6% for ₹2,000–₹5,000, and 5% for orders above ₹5,000." },
  { q: "What happens if a buyer raises a dispute?", a: "The disputed amount is held separately. You have 3 days to respond with evidence. If no response, the decision goes in the buyer's favour." },
  { q: "How do I list a used part?", a: "Go to Sell → Used Parts → Add Product. You get 3 free listings. Additional listings require a small paid boost." },
  { q: "Why is my shop suspended?", a: "Shops are suspended for policy violations. The reason is shown on your dashboard banner. Contact support to resolve and get your shop reinstated." },
]

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
  isOwn: boolean
}

export default function SellerHelpPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<"chat" | "faq">("chat")
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const [token, setToken] = useState<string | null>(null)
  const [sellerUser, setSellerUser] = useState<any>({})
  const API = process.env.NEXT_PUBLIC_API_URL

  useEffect(() => {
    const t = localStorage.getItem("seller_token")
    const u = JSON.parse(localStorage.getItem("seller_user") || "{}")
    setToken(t)
    setSellerUser(u)
  }, [])

  // Fetch support messages
  useEffect(() => {
    if (!token) return
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [token])

  async function fetchMessages() {
    try {
      const res = await fetch(`${API}/api/messages/support`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) return
      const data = await res.json()
      const msgs: Message[] = (data.messages || []).map((m: any) => ({
        id: m.id,
        sender_id: m.sender_id,
        content: m.content,
        created_at: m.created_at,
        isOwn: m.sender_id === sellerUser?.id
      }))
      setMessages(msgs)
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || sending) return
    setSending(true)
    const text = input.trim()
    setInput("")
    try {
      await fetch(`${API}/api/messages/support`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: text })
      })
      await fetchMessages()
    } catch {}
    setSending(false)
    inputRef.current?.focus()
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Help Center</h1>
          <p className="text-gray-500 text-sm mt-1">Get help from the Partly team or browse common questions</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === "chat" ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Chat with Support
          </button>
          <button
            onClick={() => setActiveTab("faq")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === "faq" ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            FAQs
          </button>
        </div>

        {/* ─── CHAT TAB ─── */}
        {activeTab === "chat" && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col" style={{ height: "600px" }}>

            {/* Chat header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Partly Support</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Replies within 24 hours on working days
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {loading ? (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">Loading...</div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                    <MessageCircle className="w-7 h-7 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Start a conversation</p>
                    <p className="text-sm text-gray-500 mt-1">Send us a message and we'll get back to you</p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.isOwn ? "justify-end" : "justify-start"}`}>
                      {!m.isOwn && (
                        <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center mr-2 shrink-0 mt-1">
                          <span className="text-white font-bold text-xs">P</span>
                        </div>
                      )}
                      <div className={`max-w-xs lg:max-w-md ${m.isOwn ? "" : ""}`}>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                          m.isOwn
                            ? "bg-gray-900 text-white rounded-br-sm"
                            : "bg-gray-100 text-gray-900 rounded-bl-sm"
                        }`}>
                          {m.content}
                        </div>
                        <p className={`text-xs text-gray-400 mt-1 ${m.isOwn ? "text-right" : ""}`}>
                          {formatTime(m.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-100">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder="Type your message..."
                  rows={1}
                  className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 max-h-32"
                  style={{ minHeight: "44px" }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center hover:bg-gray-700 transition-colors disabled:opacity-40 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Press Enter to send · Shift+Enter for new line</p>
            </div>
          </div>
        )}

        {/* ─── FAQ TAB ─── */}
        {activeTab === "faq" && (
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-semibold text-gray-900 pr-4">{faq.q}</span>
                  {openFaq === i
                    ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  }
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mt-4">
              <p className="text-sm font-semibold text-blue-900 mb-1">Still need help?</p>
              <p className="text-sm text-blue-700">Switch to the Chat tab to send us a message directly. We reply within 24 hours on working days.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}