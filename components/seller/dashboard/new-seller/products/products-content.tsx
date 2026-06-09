"use client"

import { useState, useEffect } from "react"
import { Package, FolderTree, PlusCircle, Search, Download, Plus, Pencil, Trash2, Eye, ChevronLeft, ChevronRight, RefreshCw, Truck, Zap, AlertTriangle } from "lucide-react"
import { AddProduct } from "@/components/seller/dashboard/new-seller/products/add-product"
import { useProducts } from "@/contexts/products-context"
import { mapDbToProduct } from "@/lib/supabase"

export type Category = {
  id: string
  name: string
  productCount: number
  description: string
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: "1", name: "Engine", productCount: 0, description: "Engine parts and components" },
  { id: "2", name: "Body Parts", productCount: 0, description: "Exterior body parts" },
  { id: "3", name: "Brakes", productCount: 0, description: "Brake systems and pads" },
  { id: "4", name: "Wheels", productCount: 0, description: "Wheels, tyres and rims" },
  { id: "5", name: "Electrical", productCount: 0, description: "Electrical components" },
  { id: "6", name: "Exhaust", productCount: 0, description: "Exhaust systems" },
  { id: "7", name: "Interior", productCount: 0, description: "Interior parts" },
]

const CATEGORIES_KEY = "partly_seller_categories"
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

const statusConfig = {
  Published: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  Draft: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  Inactive: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  "Stock Out": { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
}

export function ProductsContent() {
  const { products, setProducts, saveProduct, deleteProduct, loading, refreshProducts } = useProducts()
  const [activeTab, setActiveTab] = useState("products")
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  const [newCatName, setNewCatName] = useState("")
  const [newCatDesc, setNewCatDesc] = useState("")
  const [showAddCat, setShowAddCat] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    label: string
    onConfirm: () => void
  }>({ open: false, label: "", onConfirm: () => {} })
  const [skipConfirm, setSkipConfirm] = useState(false)
  const itemsPerPage = 10

  // Restore tab from sessionStorage and categories from localStorage on mount
  useEffect(() => {
    const savedTab = sessionStorage.getItem("seller_active_tab")
    if (savedTab) setActiveTab(savedTab)
    setCategories(loadCategories())
  }, [])

  // Persist tab to sessionStorage whenever it changes
  const switchTab = (tab: string) => {
    setActiveTab(tab)
    sessionStorage.setItem("seller_active_tab", tab)
  }

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || p.status === statusFilter
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
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

  // Check sessionStorage on every open (reset when browser tab closes)
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

  const handleDelete = async (id: string) => {
    await deleteProduct(id)
  }

  const handleEdit = async (product: any) => {
    try {
      const token = localStorage.getItem("seller_token")
      const API = process.env.NEXT_PUBLIC_API_URL
      const res = await fetch(`${API}/api/products/${product.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      if (json.product) {
        setEditingProduct(mapDbToProduct(json.product))
      } else {
        setEditingProduct(product)
      }
    } catch {
      setEditingProduct(product)
    }
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

  const handleDeleteCategory = (id: string) => {
    const updated = categories.filter((c) => c.id !== id)
    setCategories(updated)
    saveCategories(updated)
  }

  const getStockDisplay = (stock: number) => {
    if (stock === 0) return <span className="text-red-600 text-xs font-medium">Out of Stock</span>
    if (stock < 5) return <span className="text-xs">{stock} <span className="text-orange-600 font-medium">Low</span></span>
    return <span className="text-xs text-gray-700">{stock}</span>
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
              <h2 className="text-xl font-semibold text-gray-900">
                {categoryFilter !== "all" ? categoryFilter : "All Products"}
              </h2>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                {loading ? "Loading..." : `${filteredProducts.length} products`}
                {categoryFilter !== "all" && (
                  <button onClick={() => setCategoryFilter("all")} className="text-xs text-blue-600 hover:underline">
                    ✕ Clear filter
                  </button>
                )}
              </p>
            </div>
            <button
              onClick={() => { setEditingProduct(null); switchTab("add") }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add New Product
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
                <option value="Inactive">Inactive</option>
                <option value="Stock Out">Stock Out</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50">
                <Download className="h-4 w-4" /> Export
              </button>
              <button
                onClick={() => refreshProducts()}
                className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
              </button>
            </div>
          </div>

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
                    <th className="text-left text-xs font-medium text-gray-500 py-3 px-2">Product</th>
                    <th className="text-left text-xs font-medium text-gray-500 py-3 px-2">Stock</th>
                    <th className="text-left text-xs font-medium text-gray-500 py-3 px-2">Price</th>
                    <th className="text-left text-xs font-medium text-gray-500 py-3 px-2">Category</th>
                    <th className="text-left text-xs font-medium text-gray-500 py-3 px-2">Condition</th>
                    <th className="text-left text-xs font-medium text-gray-500 py-3 px-2">Status</th>
                    <th className="text-left text-xs font-medium text-gray-500 py-3 px-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center">
                        <Package className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-400">No products found</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.map((product) => (
                      <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => toggleSelect(product.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                              {product.image && <img src={product.image} alt={product.name} className="w-full h-full object-cover" />}
                              {product.flairTag && (
                                <div className={`absolute top-0 left-0 px-1 py-0.5 text-[8px] font-semibold leading-none
                                  ${product.flairTag === "OEM" ? "bg-blue-600 text-white" :
                                    product.flairTag === "Genuine" ? "bg-green-600 text-white" :
                                    "bg-orange-500 text-white"}`}>
                                  {product.flairTag}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-900 line-clamp-2 max-w-[200px]">{product.name}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{product.brand} | SKU: {product.sku}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {product.freeShipping && (
                                  <div className="flex items-center gap-1">
                                    <Truck className="h-3 w-3 text-green-600" />
                                    <span className="text-[10px] text-green-600">Free</span>
                                  </div>
                                )}
                                {product.fastShipping && (
                                  <div className="flex items-center gap-1">
                                    <Zap className="h-3 w-3 text-blue-600" />
                                    <span className="text-[10px] text-blue-600">Fast</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2">{getStockDisplay(product.stock)}</td>
                        <td className="py-3 px-2">
                          <div className="text-xs font-medium text-gray-900">
                            ₹{product.price?.toLocaleString("en-IN")}
                          </div>
                          {product.originalPrice > product.price && (
                            <div className="text-[10px] text-gray-400 line-through">
                              ₹{product.originalPrice?.toLocaleString("en-IN")}
                            </div>
                          )}
                          {product.discountPercent > 0 && (
                            <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
                              {product.discountPercent}% OFF
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-xs text-blue-600">{product.category}</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            product.condition === "new" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"
                          }`}>
                            {product.condition === "new" ? "New" : "Used"}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium
                            ${statusConfig[product.status]?.bg}
                            ${statusConfig[product.status]?.text}
                            ${statusConfig[product.status]?.border}`}>
                            {product.status}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => window.open(`/product/${product.id}`, "_blank")}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="View product page"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(product)}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => requestDelete(product.name, () => handleDelete(product.id))}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {!loading && filteredProducts.length > 0 && (
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
                  <label className="text-xs font-medium text-gray-700 block mb-1">Category Name*</label>
                  <input
                    type="text"
                    placeholder="e.g. Suspension"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="Brief description"
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setShowAddCat(false); setNewCatName(""); setNewCatDesc("") }}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCategory}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Add Category
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const catProductCount = products.filter(p => p.category === cat.name).length
              return (
                <div key={cat.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-200 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <FolderTree className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{cat.name}</p>
                        <p className="text-xs text-gray-500">{catProductCount} products</p>
                      </div>
                    </div>
                    <button
                      onClick={() => requestDelete(cat.name, () => handleDeleteCategory(cat.id))}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-3 mb-3">{cat.description}</p>
                  <button
                    onClick={() => {
                      switchTab("products")
                      setStatusFilter("all")
                      setSearch("")
                      setCategoryFilter(cat.name)
                    }}
                    className="w-full text-xs text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg py-1.5 transition-colors font-medium"
                  >
                    View {catProductCount} Products →
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDialog({ open: false, label: "", onConfirm: () => {} })} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Delete this item?</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">"{confirmDialog.label}" will be permanently removed.</p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={skipConfirm}
                onChange={(e) => setSkipConfirm(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 accent-blue-600"
              />
              <span className="text-xs text-gray-500">Don't ask again this session</span>
            </label>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDialog({ open: false, label: "", onConfirm: () => {} })}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product */}
      {activeTab === "add" && (
        <AddProduct
          categories={categories}
          editingProduct={editingProduct}
          products={products}
          onEditProduct={(product) => setEditingProduct(product)}
          onDeleteDraft={async (id) => await deleteProduct(id)}
          onSave={async (product) => {
            const existingDraft = !editingProduct
              ? products.find(p => p.status === "Draft" && (p.sku === product.sku || p.name === product.name))
              : null

            const productToSave = {
              ...product,
              id: editingProduct ? editingProduct.id : existingDraft ? existingDraft.id : undefined,
              condition: "new" as "new" | "used",
              vehicle_make: product.vehicle_make || editingProduct?.vehicle_make || "",
              vehicle_model: product.vehicle_model || editingProduct?.vehicle_model || "",
              vehicle_year: product.vehicle_year || editingProduct?.vehicle_year || "",
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