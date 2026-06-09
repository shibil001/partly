"use client"

import { useState } from "react"
import { SellerSidebar } from "@/components/seller/dashboard/shared/sidebar"
import { SellerHeader } from "@/components/seller/dashboard/shared/header"
import { OrdersContent } from "@/components/seller/dashboard/orders/orders-content"

export default function SellerOrdersPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      <SellerSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <SellerHeader />
        <OrdersContent />
      </div>
    </div>
  )
}