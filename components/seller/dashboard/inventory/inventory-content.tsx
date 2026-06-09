"use client"

import { useState } from "react"
import {
  Search, RefreshCw, AlertTriangle, Package,
  TrendingUp, Plus, Minus, Edit, ChevronDown, ChevronUp,
  Download, BarChart3, CheckCircle, XCircle
} from "lucide-react"
import { useProducts } from "@/contexts/products-context"

type StockStatus = "In Stock" | "Low Stock" | "Out of Stock" | "Overstocked"

const getStockStatus = (stock: number, minStock: number, maxStock: number): StockStatus => {
  if (stock === 0) return "Out of Stock"
  if (stock < minStock) return "Low Stock"
  if (maxStock > 0 && stock > maxStock) return "Overstocked"
  return "In Stock"
}

const statusColors: Record<StockStatus, string> = {
  "In Stock": "bg-green-50 text-green-700 border-green-200",
  "Low Stock": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "Out of Stock": "bg-red-50 text-red-700 border-red-200",
  "Overstocked": "bg-blue-50 text-blue-700 border-blue-200",
}

export function InventoryContent() {
  const { products, updateProduct } = useProducts()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [adjustingId, setAdjustingId] = useState<string | null>(null)
  const [adjustAmount, setAdjustAmount] = useState("")
  const [adjustType, setAdjustType] = useState<"add" | "remove">("add")
  const [adjustNote, setAdjustNote] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "stock" | "status">("name")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))]

  const filtered = products
    .filter(item => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase()) ||
        item.brand.toLowerCase().includes(search.toLowerCase())
      const status = getStockStatus(item.stock, item.minStock || 0, item.maxStock || 0)
      const matchStatus = statusFilter === "all" || status === statusFilter
      const matchCat = categoryFilter === "all" || item.category === categoryFilter
      return matchSearch && matchStatus && matchCat
    })
    .sort((a, b) => {
      let val = 0
      if (sortBy === "name") val = a.name.localeCompare(b.name)
      if (sortBy === "stock") val = a.stock - b.stock
      if (sortBy === "status") val = getStockStatus(a.stock, a.minStock || 0, a.maxStock || 0)
        .localeCompare(getStockStatus(b.stock, b.minStock || 0, b.maxStock || 0))
      return sortDir === "asc" ? val : -val
    })

  const stats = {
    total: products.length,
    inStock: products.filter(p => getStockStatus(p.stock, p.minStock || 0, p.maxStock || 0) === "In Stock").length,
    lowStock: products.filter(p => getStockStatus(p.stock, p.minStock || 0, p.maxStock || 0) === "Low Stock").length,
    outOfStock: products.filter(p => getStockStatus(p.stock, p.minStock || 0, p.maxStock || 0) === "Out of Stock").length,
    overstocked: products.filter(p => getStockStatus(p.stock, p.minStock || 0, p.maxStock || 0) === "Overstocked").length,
    totalValue: products.reduce((sum, p) => sum + (p.stock * (p.costPrice || p.originalPrice || 0)), 0),
  }

  const handleAdjust = (id: string) => {
    const amount = parseInt(adjustAmount)
    if (!amount || amount <= 0) return
    const item = products.find(p => p.id === id)
    if (!item) return
    const newStock = adjustType === "add"
      ? item.stock + amount
      : Math.max(0, item.stock - amount)
    updateProduct(id, {
      stock: newStock,
      lastUpdated: new Date().toISOString().split("T")[0],
    } as any)
    setAdjustingId(null)
    setAdjustAmount("")
    setAdjustNote("")
  }

  const toggleSort = (field: "name" | "stock" | "status") => {
    if (sortBy === field) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortBy(field); setSortDir("asc") }
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-6">

      {/* Adjust Dialog */}
      {adjustingId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Adjust Stock</h3>
            <p className="text-xs text-gray-400 mb-4">
              {products.find(p => p.id === adjustingId)?.name}
            </p>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setAdjustType("add")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    adjustType === "add"
                      ? "bg-green-600 text-white border-green-600"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Plus className="h-4 w-4" /> Add Stock
                </button>
                <button
                  onClick={() => setAdjustType("remove")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    adjustType === "remove"
                      ? "bg-red-500 text-white border-red-500"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Minus className="h-4 w-4" /> Remove
                </button>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(e.target.value)}
                  placeholder="Enter quantity"
                  autoFocus
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Note (optional)</label>
                <input
                  type="text"
                  value={adjustNote}
                  onChange={e => setAdjustNote(e.target.value)}
                  placeholder="e.g. New shipment received"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setAdjustingId(null); setAdjustAmount(""); setAdjustNote("") }}
                  className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAdjust(adjustingId)}
                  disabled={!adjustAmount || parseInt(adjustAmount) <= 0}
                  className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500">Manage your stock levels</p>
        </div>
        <button className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50">
          <Download className="h-4 w-4" /> Export
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {[
          { label: "Total Items", value: stats.total, icon: <Package className="h-4 w-4 text-blue-600" />, color: "text-gray-900" },
          { label: "In Stock", value: stats.inStock, icon: <CheckCircle className="h-4 w-4 text-green-600" />, color: "text-green-700" },
          { label: "Low Stock", value: stats.lowStock, icon: <AlertTriangle className="h-4 w-4 text-yellow-600" />, color: "text-yellow-700" },
          { label: "Out of Stock", value: stats.outOfStock, icon: <XCircle className="h-4 w-4 text-red-600" />, color: "text-red-700" },
          { label: "Overstocked", value: stats.overstocked, icon: <TrendingUp className="h-4 w-4 text-blue-600" />, color: "text-blue-700" },
          { label: "Total Value", value: `₹${(stats.totalValue / 100000).toFixed(1)}L`, icon: <BarChart3 className="h-4 w-4 text-purple-600" />, color: "text-gray-900" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">{stat.icon}<span className="text-xs text-gray-500">{stat.label}</span></div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, SKU, brand..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="Overstocked">Overstocked</option>
          </select>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left text-xs font-medium text-gray-500 py-3 px-4">
                <button onClick={() => toggleSort("name")} className="flex items-center gap-1 hover:text-gray-900">
                  Product {sortBy === "name" ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : null}
                </button>
              </th>
              <th className="text-left text-xs font-medium text-gray-500 py-3 px-2">Category</th>
              <th className="text-left text-xs font-medium text-gray-500 py-3 px-2">Location</th>
              <th className="text-left text-xs font-medium text-gray-500 py-3 px-2">
                <button onClick={() => toggleSort("stock")} className="flex items-center gap-1 hover:text-gray-900">
                  Stock {sortBy === "stock" ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : null}
                </button>
              </th>
              <th className="text-left text-xs font-medium text-gray-500 py-3 px-2">Min / Max</th>
              <th className="text-left text-xs font-medium text-gray-500 py-3 px-2">Stock Bar</th>
              <th className="text-left text-xs font-medium text-gray-500 py-3 px-2">
                <button onClick={() => toggleSort("status")} className="flex items-center gap-1 hover:text-gray-900">
                  Status {sortBy === "status" ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : null}
                </button>
              </th>
              <th className="text-left text-xs font-medium text-gray-500 py-3 px-2">Value</th>
              <th className="text-left text-xs font-medium text-gray-500 py-3 px-2">Last Updated</th>
              <th className="text-left text-xs font-medium text-gray-500 py-3 px-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => {
              const minStock = item.minStock || 0
              const maxStock = item.maxStock || 0
              const status = getStockStatus(item.stock, minStock, maxStock)
              const stockPct = maxStock > 0 ? Math.min((item.stock / maxStock) * 100, 100) : 0
              const barColor = status === "Out of Stock" ? "bg-red-500" :
                status === "Low Stock" ? "bg-yellow-500" :
                status === "Overstocked" ? "bg-blue-500" : "bg-green-500"
              const costPrice = item.costPrice || item.originalPrice || 0

              return (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center text-gray-400 text-xs font-bold">
                          {item.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium text-gray-900 line-clamp-1 max-w-[160px]">{item.name}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{item.brand} | SKU: {item.sku}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium mt-0.5 inline-block ${
                          item.status === "Published" ? "bg-green-50 text-green-700" :
                          item.status === "Draft" ? "bg-yellow-50 text-yellow-700" :
                          "bg-gray-50 text-gray-500"
                        }`}>{item.status}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-xs text-blue-600">{item.category}</span>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-xs text-gray-600">{item.location || "—"}</span>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`text-sm font-bold ${
                      status === "Out of Stock" ? "text-red-600" :
                      status === "Low Stock" ? "text-yellow-700" :
                      status === "Overstocked" ? "text-blue-700" : "text-gray-900"
                    }`}>
                      {item.stock} <span className="text-[10px] font-normal text-gray-400">{item.stockUnit}</span>
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-xs text-gray-500">
                      {minStock > 0 || maxStock > 0 ? `${minStock} / ${maxStock}` : "—"}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    {maxStock > 0 ? (
                      <>
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${stockPct}%` }} />
                        </div>
                        <span className="text-[10px] text-gray-400 mt-0.5 block">{Math.round(stockPct)}%</span>
                      </>
                    ) : <span className="text-xs text-gray-400">—</span>}
                  </td>
                  <td className="py-3 px-2">
                    <span className={`text-[10px] px-2 py-1 rounded-full border font-medium ${statusColors[status]}`}>
                      {status}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    {costPrice > 0 ? (
                      <>
                        <p className="text-xs font-medium text-gray-900">₹{(item.stock * costPrice).toLocaleString("en-IN")}</p>
                        <p className="text-[10px] text-gray-400">@ ₹{costPrice.toLocaleString("en-IN")}</p>
                      </>
                    ) : <span className="text-xs text-gray-400">—</span>}
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-xs text-gray-500">{(item as any).lastUpdated || item.createdAt}</span>
                  </td>
                  <td className="py-3 px-2">
                    <button
                      onClick={() => setAdjustingId(item.id)}
                      className="flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit className="h-3 w-3" /> Adjust
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <Package className="h-8 w-8 mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">No inventory items found</p>
          </div>
        )}

        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500">{filtered.length} of {products.length} items</span>
          {(statusFilter !== "all" || categoryFilter !== "all" || search) && (
            <button
              onClick={() => { setStatusFilter("all"); setCategoryFilter("all"); setSearch("") }}
              className="text-xs text-blue-600 hover:underline"
            >
              ✕ Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  )
}