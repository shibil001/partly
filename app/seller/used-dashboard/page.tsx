"use client"

import { useState } from "react"
import { SellerSidebar } from "@/components/seller/dashboard/shared/sidebar"
import { SellerHeader } from "@/components/seller/dashboard/shared/header"
import { TopSalesByState } from "@/components/seller/dashboard/shared/top-sales-state"
import { LastActivity } from "@/components/seller/dashboard/shared/last-activity"
import { UsedPartsStatCards } from "@/components/seller/dashboard/used-seller/used-parts-stat-cards"

export default function UsedSellerDashboardPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      <SellerSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <SellerHeader />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <UsedPartsStatCards />
          <TopSalesByState />
          <LastActivity />
        </main>
      </div>
    </div>
  )
}