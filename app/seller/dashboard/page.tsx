"use client"

import { useState } from "react"
import { SellerSidebar } from "@/components/seller/dashboard/shared/sidebar"
import { SellerHeader } from "@/components/seller/dashboard/shared/header"
import { StatCards } from "@/components/seller/dashboard/new-seller/stat-cards"
import { SalesChart } from "@/components/seller/dashboard/new-seller/sales-chart"
import { TopSalesByState } from "@/components/seller/dashboard/shared/top-sales-state"
import { LastActivity } from "@/components/seller/dashboard/shared/last-activity"
import { RevenueCards } from "@/components/seller/dashboard/new-seller/revenue-cards"

export default function SellerDashboardPage() {
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
          <StatCards />
          <RevenueCards />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <SalesChart />
            </div>
            <div>
              <TopSalesByState />
            </div>
          </div>
          <LastActivity />
        </main>
      </div>
    </div>
  )
}