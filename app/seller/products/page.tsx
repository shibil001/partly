"use client"

import { useState } from "react"
import { SellerSidebar } from "@/components/seller/dashboard/shared/sidebar"
import { SellerHeader } from "@/components/seller/dashboard/shared/header"
import { ProductsContent } from "@/components/seller/dashboard/new-seller/products/products-content"

export default function SellerProductsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      <SellerSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <SellerHeader />
        <ProductsContent />
      </div>
    </div>
  )
}