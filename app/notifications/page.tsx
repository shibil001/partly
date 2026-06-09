"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import {
  Bell, Package, MessageCircle, Tag, ShoppingBag,
  CheckCircle, Truck, XCircle, ChevronRight, Inbox
} from "lucide-react"

type AppNotification = {
  id: string
  type: string
  title: string
  body: string
  link?: string
  read: boolean
  created_at: string
}

const API = process.env.NEXT_PUBLIC_API_URL

function getIcon(type: string) {
  switch (type) {
    case 'order_placed':    return <ShoppingBag className="h-5 w-5 text-blue-600" />
    case 'order_received':  return <Package className="h-5 w-5 text-purple-600" />
    case 'order_status':    return <Truck className="h-5 w-5 text-orange-500" />
    case 'message_received':return <MessageCircle className="h-5 w-5 text-green-600" />
    case 'offer_received':  return <Tag className="h-5 w-5 text-yellow-600" />
    case 'offer_accepted':  return <CheckCircle className="h-5 w-5 text-green-600" />
    case 'offer_declined':  return <XCircle className="h-5 w-5 text-red-500" />
    case 'request_match':   return <CheckCircle className="h-5 w-5 text-teal-600" />
    default:                return <Bell className="h-5 w-5 text-gray-500" />
  }
}

function getBg(type: string) {
  switch (type) {
    case 'order_placed':    return 'bg-blue-50'
    case 'order_received':  return 'bg-purple-50'
    case 'order_status':    return 'bg-orange-50'
    case 'message_received':return 'bg-green-50'
    case 'offer_received':  return 'bg-yellow-50'
    case 'offer_accepted':  return 'bg-green-50'
    case 'offer_declined':  return 'bg-red-50'
    case 'request_match':   return 'bg-teal-50'
    default:                return 'bg-gray-50'
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)  return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    loadNotifications()
  }, [])

  async function loadNotifications() {
    try {
      const token = localStorage.getItem('token')
      if (!token) { setLoading(false); return }
      const res = await fetch(`${API}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      setNotifications(json.notifications || [])
    } catch {}
    setLoading(false)
  }

  async function markRead(id: string) {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${API}/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      window.dispatchEvent(new Event('notifications-change'))
    } catch {}
  }

  async function markAllRead() {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${API}/api/notifications/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      window.dispatchEvent(new Event('notifications-change'))
    } catch {}
  }

  function getLink(n: AppNotification): string | null {
    if (n.link) return n.link
    const data = (n as any).data || {}
    switch (n.type) {
      // Seller notifications
      case 'order_received':
        return '/seller/orders'
      case 'offer_received':
      case 'message_received':
        return '/seller/customers'
      // Buyer notifications
      case 'order_placed':
      case 'order_status':
      case 'order_confirmed':
      case 'order_cancelled':
      case 'order_shipped':
      case 'order_delivered':
        return '/orders'
      case 'offer_accepted':
      case 'offer_declined':
        return '/messages'
      case 'request_match':
        return data.request_id ? `/requests?id=${data.request_id}` : '/requests'
      default:
        return null
    }
  }

  function handleClick(n: AppNotification) {
    if (!n.read) markRead(n.id)
    const link = getLink(n)
    if (link) window.location.href = link
  }

  const filtered = filter === 'unread' ? notifications.filter((n: AppNotification) => !n.read) : notifications
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500 mt-0.5">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-sm text-blue-600 font-medium hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'unread'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? 'All' : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
            </button>
          ))}
        </div>

        {/* Notifications list */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Inbox className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              We'll notify you about orders, messages and offers here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((n: AppNotification) => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`relative flex items-start gap-3 p-4 rounded-xl border transition-all hover:shadow-sm ${getLink(n) ? 'cursor-pointer' : 'cursor-default'} ${
                  n.read
                    ? 'bg-white border-gray-100'
                    : 'bg-white border-blue-100 shadow-sm'
                }`}
              >
                {/* Unread dot */}
                {!n.read && (
                  <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500" />
                )}

                {/* Icon */}
                <div className={`w-10 h-10 rounded-full ${getBg(n.type)} flex items-center justify-center shrink-0`}>
                  {getIcon(n.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-4">
                  <p className={`text-sm font-semibold ${n.read ? 'text-gray-700' : 'text-gray-900'}`}>
                    {n.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5 leading-snug">{n.body}</p>
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                </div>

                {n.link && (
                  <ChevronRight className="h-4 w-4 text-gray-300 shrink-0 mt-1" />
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}