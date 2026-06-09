"use client"

import { useState } from "react"
import { SellerSidebar } from "@/components/seller/dashboard/shared/sidebar"
import { SellerHeader } from "@/components/seller/dashboard/shared/header"
import { InventoryContent } from "@/components/seller/dashboard/inventory/inventory-content"

export default function SellerInventoryPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      <SellerSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <SellerHeader />
        <InventoryContent />
      </div>
    </div>
  )
}