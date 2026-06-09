"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { mapProductToDb, mapDbToProduct } from "@/lib/supabase"

export type Product = {
  id: string
  productCode: string
  sku: string
  name: string
  brand: string
  image: string
  images?: string[]
  category: string
  price: number
  originalPrice: number
  currency: string
  discountPercent: number
  stock: number
  stockUnit: string
  minStock: number
  maxStock: number
  location: string
  district: string
  state: string
  pincode: string
  status: "Published" | "Draft" | "Inactive" | "Stock Out"
  freeShipping: boolean
  fastShipping: boolean
  flairTag?: "OEM" | "Aftermarket" | "Genuine" | null
  condition: "new" | "used" | "New" | "Used - Like New" | "Used - Good" | "Used - Fair" | "Refurbished" | string
  partType?: "new" | "used"
  partNumber?: string
  vehicleModel?: string
  year?: string
  vehicle_make: string
  vehicle_model: string
  vehicle_year: string
  description: string
  createdAt: string
  material?: string
  colour?: string
  weight?: string
  weightUnit?: string
  measurements?: string
  size?: string
  keywords?: string
  fitment?: string
  warranty?: string
  warrantyTerms?: string
  includes?: string
  features?: string
  costPrice?: number
  customFields?: { label: string; value: string }[]
}

interface ProductsContextType {
  products: Product[]
  setProducts: (products: Product[] | ((prev: Product[]) => Product[])) => void
  updateProduct: (id: string, updates: Partial<Product>) => void
  saveProduct: (product: any) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  loading: boolean
  refreshProducts: () => Promise<void>
}

const ProductsContext = createContext<ProductsContextType | null>(null)

const API = process.env.NEXT_PUBLIC_API_URL

function getToken(): string | null {
  try { return localStorage.getItem("seller_token") } catch { return null }
}

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    refreshProducts()
  }, [])

  const refreshProducts = async () => {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) { setProducts([]); setLoading(false); return }
      const res = await fetch(`${API}/api/sellers/products`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      if (json.products) setProducts(json.products.map(mapDbToProduct))
    } catch {}
    setLoading(false)
  }

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
    try {
      const token = getToken()
      const res = await fetch(`${API}/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(mapProductToDb({ ...updates }))
      })
      const json = await res.json()
      if (json.product) {
        setProducts(prev => prev.map(p => p.id === id ? mapDbToProduct(json.product) : p))
      }
    } catch {}
  }

  const saveProduct = async (product: any) => {
    const token = getToken()
    const dbProduct = mapProductToDb(product)
    try {
      if (product.id && products.find(p => p.id === product.id)) {
        // Update existing
        const res = await fetch(`${API}/api/products/${product.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(dbProduct)
        })
        const json = await res.json()
        if (json.product) {
          setProducts(prev => prev.map(p => p.id === product.id ? mapDbToProduct(json.product) : p))
        }
      } else {
        // Insert new
        const res = await fetch(`${API}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(dbProduct)
        })
        const json = await res.json()
        if (json.product) {
          setProducts(prev => [mapDbToProduct(json.product), ...prev])
        }
      }
    } catch {}
  }

  const deleteProduct = async (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id))
    try {
      const token = getToken()
      await fetch(`${API}/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch {}
  }

  return (
    <ProductsContext.Provider value={{
      products, setProducts, updateProduct,
      saveProduct, deleteProduct, loading, refreshProducts
    }}>
      {children}
    </ProductsContext.Provider>
  )
}

export function useProducts() {
  const ctx = useContext(ProductsContext)
  if (!ctx) throw new Error("useProducts must be used within ProductsProvider")
  return ctx
}