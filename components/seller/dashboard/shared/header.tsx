"use client"

import { useEffect, useState, useRef } from "react"
import { Bell, X } from "lucide-react"

interface Notification {
  id: string
  title: string
  message: string
  link?: string
  read: boolean
  created_at: string
}

export function SellerHeader() {
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const fetchCount = async () => {
    const token = localStorage.getItem("seller_token")
    if (!token) return
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/count`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data?.count !== undefined) setUnread(data.count)
    } catch {}
  }

  const fetchNotifications = async () => {
    const token = localStorage.getItem("seller_token")
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnread(0)
      // Mark all as read
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/read-all`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }
      })
    } catch {}
    finally { setLoading(false) }
  }

  const handleOpen = () => {
    setOpen(v => !v)
    if (!open) fetchNotifications()
  }

  return (
    <header className="flex items-center justify-end px-6 bg-white border-b border-gray-200 h-[73px]">
      <div className="relative" ref={dropdownRef}>
        <button onClick={handleOpen} className="relative p-2 text-gray-500 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-100">
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
              <button onClick={() => setOpen(false)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100">
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="py-8 flex justify-center">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map(n => (
                    <a key={n.id} href={n.link || "#"}
                      className={`block px-4 py-3 hover:bg-gray-50 transition-colors ${!n.read ? "bg-blue-50/50" : ""}`}>
                      <p className="text-xs font-semibold text-gray-900">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-gray-300 mt-1">
                        {new Date(n.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}