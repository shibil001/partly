"use client"

import { useState, useEffect } from "react"
import {
  Package, FolderTree, PlusCircle, Search, Plus, Pencil,
  Trash2, Eye, ChevronLeft, ChevronRight, RefreshCw, AlertTriangle, MapPin
} from "lucide-react"
import { AddProduct } from "@/components/seller/dashboard/products/add-product"
import { useProducts } from "@/contexts/products-context"

export type Category = {
  id: string
  name: string
  productCount: number
  description: string
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: "1", name: "Engine Parts", productCount: 0, description: "Used engine components" },
  { id: "2", name: "Body Parts", productCount: 0, description: "Used exterior body parts" },
  { id: "3", name: "Brakes", productCount: 0, description: "Used brake systems" },
  { id: "4", name: "Wheels & Tyres", productCount: 0, description: "Used wheels and tyres" },
  { id: "5", name: "Electricals", productCount: 0, description: "Used electrical components" },
  { id: "6", name: "Suspension", productCount: 0, description: "Used suspension parts" },
  { id: "7", name: "Transmission", productCount: 0, description: "Used transmission parts" },
]

const CATEGORIES_KEY = "partly_used_seller_categories"
const SKIP_DELETE_CONFIRM_KEY = "partly_skip_delete_confirm"

function loadCategories(): Category[] {
  try {
    const stored = localStorage.getItem(CATEGORIES_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return DEFAULT_CATEGORIES
}

function saveCategories(cats: Category[]) {
  try { localStorage.setItem(CATEGORIES_KEY, JSON.stringify(cats)) } catch {}
}

const conditionConfig: Record<string, { bg: string; text: string; border: string }> = {
  "New":            { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200" },
  "Used - Like New":{ bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200" },
  "Used - Good":    { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  "Used - Fair":    { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  "Refurbished":    { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
}

const statusConfig: Record<string, { bg: string; text: string; border: string }> = {
  Published:   { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200" },
  Draft:       { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  Inactive:    { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200" },
  "Stock Out": { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
}

export function UsedProductsContent() {
  const { products, saveProduct, deleteProduct, loading, refreshProducts } = useProducts()
  const [activeTab, setActiveTab] = useState("products")
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  const [newCatName, setNewCatName] = useState("")
  const [newCatDesc, setNewCatDesc] = useState("")
  const [showAddCat, setShowAddCat] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean; label: string; onConfirm: () => void
  }>({ open: false, label: "", onConfirm: () => {} })
  const [skipConfirm, setSkipConfirm] = useState(false)
  const itemsPerPage = 10

  useEffect(() => {
    const savedTab = sessionStorage.getItem("used_seller_active_tab")
    if (savedTab) setActiveTab(savedTab)
    setCategories(loadCategories())
  }, [])

  const switchTab = (tab: string) => {
    setActiveTab(tab)
    sessionStorage.setItem("used_seller_active_tab", tab)
  }

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase().trim()
    const matchesSearch = !q ||
      p.name?.toLowerCase().includes(q) ||
      p.partNumber?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.vehicleModel?.toLowerCase().includes(q)
    const matchesStatus = statusFilter === "all" || p.status === statusFilter
    return !!matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const toggleSelectAll = () => {
    if (selectedProducts.length === paginatedProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(paginatedProducts.map((p) => p.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const requestDelete = (label: string, onConfirm: () => void) => {
    const skip = sessionStorage.getItem(SKIP_DELETE_CONFIRM_KEY) === "true"
    if (skip) { onConfirm(); return }
    setSkipConfirm(false)
    setConfirmDialog({ open: true, label, onConfirm })
  }

  const confirmDelete = () => {
    if (skipConfirm) sessionStorage.setItem(SKIP_DELETE_CONFIRM_KEY, "true")
    confirmDialog.onConfirm()
    setConfirmDialog({ open: false, label: "", onConfirm: () => {} })
  }

  const handleEdit = (product: any) => {
    setEditingProduct(product)
    switchTab("add")
  }

  const handleAddCategory = () => {
    if (!newCatName.trim()) return
    const newCat: Category = {
      id: `${Date.now()}`,
      name: newCatName,
      description: newCatDesc,
      productCount: 0,
    }
    const updated = [...categories, newCat]
    setCategories(updated)
    saveCategories(updated)
    setNewCatName("")
    setNewCatDesc("")
    setShowAddCat(false)
  }

  return (
    <div className="flex-1 p-6 overflow-auto bg-gray-50">

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white border border-gray-200 rounded-xl p-1 w-fit">
        {[
          { id: "products", label: "Products List", icon: <Package className="h-4 w-4" /> },
          { id: "categories", label: "Categories", icon: <FolderTree className="h-4 w-4" /> },
          { id: "add", label: "Add or Edit", icon: <PlusCircle className="h-4 w-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id !== "add") setEditingProduct(null)
              switchTab(tab.id)
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Products List */}
      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">All Products</h2>
              <p className="text-sm text-gray-500">
                {loading ? "Loading..." : `${filteredProducts.length} used parts listed`}
              </p>
            </div>
            <button
              onClick={() => { setEditingProduct(null); switchTab("add") }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add New Part
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, part no, vehicle..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-72"
                />
              </div>
              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
                <option value="Inactive">Inactive</option>
              </select>

            </div>
            <button
              onClick={() => refreshProducts()}
              className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {loading ? (
              <div className="py-12 text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-400">Loading products...</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="w-8 py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === paginatedProducts.length && paginatedProducts.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 py-3 px-2">Part</th>
                    <th className="text-left text-xs font-medium text-gray-500 py-3 px-2">Vehicle Model</th>
                    <th className="text-left text-xs font-medium text-gray-500 py-3 px-2">Year</th>
                    <th className="text-left text-xs font-medium text-gray-500 py-3 px-2">Condition</th>
                    <th className="text-left text-xs font-medium text-gray-500 py-3 px-2">Price</th>
                    <th className="text-left text-xs font-medium text-gray-500 py-3 px-2">Location</th>
                    <th className="text-left text-xs font-medium text-gray-500 py-3 px-2">Status</th>
                    <th className="text-left text-xs font-medium text-gray-500 py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center">
                        <Package className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-400">No used parts found</p>
                        <button
                          onClick={() => switchTab("add")}
                          className="mt-3 text-sm text-blue-600 hover:underline"
                        >
                          + Add your first part
                        </button>
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.map((product) => {
                      const cond = product.condition || ""
                      const condStyle = conditionConfig[cond] || { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" }
                      const statStyle = statusConfig[product.status] || { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" }
                      return (
                        <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(product.id)}
                              onChange={() => toggleSelect(product.id)}
                              className="rounded border-gray-300"
                            />
                          </td>

                          {/* Part info */}
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                {product.image
                                  ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                  : <div className="w-full h-full flex items-center justify-center"><Package className="h-4 w-4 text-gray-300" /></div>
                                }
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-900 line-clamp-2 max-w-[180px]">{product.name}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{product.brand}{product.partNumber ? ` · ${product.partNumber}` : ""}</p>
                              </div>
                            </div>
                          </td>

                          {/* Vehicle Model */}
                          <td className="py-3 px-2">
                            <span className="text-xs text-gray-700">{product.vehicleModel || <span className="text-gray-300">—</span>}</span>
                          </td>

                          {/* Year */}
                          <td className="py-3 px-2">
                            <span className="text-xs text-gray-700">{product.year || <span className="text-gray-300">—</span>}</span>
                          </td>

                          {/* Condition */}
                          <td className="py-3 px-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${condStyle.bg} ${condStyle.text} ${condStyle.border}`}>
                              {cond || "—"}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="py-3 px-2">
                            <span className="text-xs font-semibold text-gray-900">
                              ₹{product.price?.toLocaleString("en-IN")}
                            </span>
                          </td>

                          {/* Location */}
                          <td className="py-3 px-2">
                            {product.district || product.state ? (
                              <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                <MapPin className="h-3 w-3 shrink-0 text-gray-400" />
                                <span className="truncate max-w-[100px]">{[product.district, product.state].filter(Boolean).join(", ")}</span>
                              </div>
                            ) : <span className="text-gray-300 text-xs">—</span>}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${statStyle.bg} ${statStyle.text} ${statStyle.border}`}>
                              {product.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => window.open(`/product/${product.id}`, "_blank")}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                title="View listing"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(product)}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => requestDelete(product.name, () => deleteProduct(product.id))}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            {!loading && filteredProducts.length > itemsPerPage && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3 w-3" /> Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  >
                    Next <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Categories */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Categories</h2>
              <p className="text-sm text-gray-500">{categories.length} categories</p>
            </div>
            <button
              onClick={() => setShowAddCat(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" /> Add Category
            </button>
          </div>

          {showAddCat && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">New Category</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Category Name *</label>
                  <input type="text" placeholder="e.g. Suspension" value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Description</label>
                  <input type="text" placeholder="Brief description" value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => { setShowAddCat(false); setNewCatName(""); setNewCatDesc("") }}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button onClick={handleAddCategory}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Add Category</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const count = products.filter(p => p.category === cat.name).length
              return (
                <div key={cat.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-200 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <FolderTree className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{cat.name}</p>
                        <p className="text-xs text-gray-500">{count} parts</p>
                      </div>
                    </div>
                    <button onClick={() => requestDelete(cat.name, () => {
                      const updated = categories.filter(c => c.id !== cat.id)
                      setCategories(updated); saveCategories(updated)
                    })} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-3 mb-3">{cat.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {confirmDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDialog({ open: false, label: "", onConfirm: () => {} })} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Delete this part?</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">"{confirmDialog.label}" will be permanently removed.</p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={skipConfirm} onChange={(e) => setSkipConfirm(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 accent-blue-600" />
              <span className="text-xs text-gray-500">Don't ask again this session</span>
            </label>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDialog({ open: false, label: "", onConfirm: () => {} })}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit */}
      {activeTab === "add" && (
        <AddProduct
          categories={categories}
          editingProduct={editingProduct}
          products={products}
          onEditProduct={(product) => setEditingProduct(product)}
          onDeleteDraft={async (id) => await deleteProduct(id)}
          onSave={async (product) => {
            const productToSave = {
              ...product,
              id: editingProduct ? editingProduct.id : undefined,
              partType: "used" as const,
              createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString().split("T")[0],
            }
            await saveProduct(productToSave)
            if (product.status !== "Draft") {
              setEditingProduct(null)
              switchTab("products")
            }
          }}
          onCancel={() => {
            setEditingProduct(null)
            switchTab("products")
          }}
        />
      )}
    </div>
  )
}