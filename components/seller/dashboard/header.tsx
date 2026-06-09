"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"

export function SellerHeader() {
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    const token = localStorage.getItem("seller_token")
    if (!token) return
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/count`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.count) setUnread(data.count) })
      .catch(() => {})
  }, [])

  return (
    <header className="flex items-center justify-end px-6 bg-white border-b border-gray-200 h-[73px]">
      <button className="relative p-2 text-gray-500 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-100">
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>
    </header>
  )
}