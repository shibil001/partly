"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface OrdersContextType {
  pendingCount: number
  setPendingCount: (count: number) => void
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined)

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [pendingCount, setPendingCount] = useState(() => {
    try { return parseInt(localStorage.getItem("seller_pending_count") || "0") || 0 } catch { return 0 }
  })

  const setPendingCountAndSave = (count: number) => {
    const val = typeof count === "function" ? (count as any)(pendingCount) : count
    setPendingCount(val)
    try { localStorage.setItem("seller_pending_count", String(val)) } catch {}
  }

  return (
    <OrdersContext.Provider value={{ pendingCount, setPendingCount: setPendingCountAndSave }}>
      {children}
    </OrdersContext.Provider>
  )
}

export function useOrders() {
  const context = useContext(OrdersContext)
  if (context === undefined) return { pendingCount: 0, setPendingCount: (_: number) => {} }
  return context
}