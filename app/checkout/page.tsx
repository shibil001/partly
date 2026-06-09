"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Package, ChevronRight, CheckCircle, Truck, Pencil, Plus, Info } from "lucide-react"

interface CartItem {
  id: string; name: string; price: number; quantity: number; image?: string; size?: string | null
}

interface SavedAddress {
  fullName: string; phone: string; email: string; address: string
  city: string; state: string; pincode: string; landmark: string
}

const INDIA_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi (UT)","Jammu & Kashmir (UT)","Ladakh (UT)",
  "Puducherry (UT)","Chandigarh (UT)","Andaman & Nicobar Islands (UT)","Lakshadweep (UT)"
]

const SAVED_ADDRESS_KEY = "partly_saved_address"
const ALL_ADDRESSES_KEY = "partly_all_addresses"
const COD_LIMIT = 50000
const UPI_LIMIT = 100000

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function inputCls(err?: string) {
  return `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${err ? "border-red-300 bg-red-50" : "border-gray-300"}`
}

export default function CheckoutPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [ordered, setOrdered] = useState(false)
  const [orderIds, setOrderIds] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [savedAddress, setSavedAddress] = useState<SavedAddress | null>(null)
  const [allAddresses, setAllAddresses] = useState<SavedAddress[]>([])
  const [editingAddress, setEditingAddress] = useState(false)
  const [selectingAddress, setSelectingAddress] = useState(false)
  const [addressDropdownOpen, setAddressDropdownOpen] = useState(false)
  const [saveThisAddress, setSaveThisAddress] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState("")
  const [form, setForm] = useState({
    fullName: "", phone: "", email: "", address: "",
    city: "", state: "", pincode: "", landmark: "",
  })

  const totalPrice = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const totalItems = cartItems.reduce((sum, i) => sum + i.quantity, 0)
  const codUnavailable = totalPrice > COD_LIMIT
  const upiUnavailable = totalPrice > UPI_LIMIT

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (!user) { router.push("/"); return }
    try {
      const mode = window.location.search.includes("mode=buynow")
      if (mode) {
        const buyNowItem = sessionStorage.getItem("buy_now_item")
        if (!buyNowItem) { router.push("/search"); return }
        setCartItems([JSON.parse(buyNowItem)])
      } else {
        const stored = localStorage.getItem("cart")
        const items = stored ? JSON.parse(stored) : []
        if (items.length === 0) { router.push("/search"); return }
        setCartItems(items)
      }
      const u = JSON.parse(user)
      const saved = localStorage.getItem(SAVED_ADDRESS_KEY)
      const all = localStorage.getItem(ALL_ADDRESSES_KEY)
      if (all) setAllAddresses(JSON.parse(all))
      if (saved) {
        const addr = JSON.parse(saved)
        setSavedAddress(addr)
        setForm(addr)
      } else {
        setForm(f => ({ ...f, fullName: u.name || u.full_name || "", email: u.email || "", phone: u.phone || "" }))
        setEditingAddress(true)
      }
    } catch { setEditingAddress(true) }

    // Set default payment based on total
    if (totalPrice > COD_LIMIT) setPaymentMethod("card")
  }, [])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.fullName.trim()) e.fullName = "Required"
    if (!/^\d{10}$/.test(form.phone.trim())) e.phone = "Valid 10-digit number required"
    if (!form.address.trim()) e.address = "Required"
    if (!form.city.trim()) e.city = "Required"
    if (!form.state) e.state = "Required"
    if (!/^\d{6}$/.test(form.pincode.trim())) e.pincode = "Valid 6-digit pincode required"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const saveAddressAndContinue = () => {
    if (!validate()) return
    const addr = { fullName: form.fullName, phone: form.phone, email: form.email, address: form.address, city: form.city, state: form.state, pincode: form.pincode, landmark: form.landmark }
    setSavedAddress(addr)
    localStorage.setItem(SAVED_ADDRESS_KEY, JSON.stringify(addr))
    if (saveThisAddress) {
      try {
        const existing: SavedAddress[] = JSON.parse(localStorage.getItem(ALL_ADDRESSES_KEY) || "[]")
        const isDuplicate = existing.some(a => a.pincode === addr.pincode && a.address === addr.address)
        if (!isDuplicate) {
          const updated = [addr, ...existing].slice(0, 5)
          localStorage.setItem(ALL_ADDRESSES_KEY, JSON.stringify(updated))
          setAllAddresses(updated)
          // Clear form fields for new address entry
          setForm(f => ({ ...f, address: "", city: "", state: "", pincode: "", landmark: "" }))
        }
      } catch {}
    }
    setEditingAddress(false)
  }

  const placeOrder = async () => {
    if (editingAddress) { saveAddressAndContinue(); return }
    if (!paymentMethod) { alert("Please select a payment method"); return }
    if (!savedAddress) { alert("Please add a delivery address"); return }
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: cartItems, total: totalPrice,
          shipping_address: { full_name: form.fullName, phone: form.phone, email: form.email, address: form.address, city: form.city, state: form.state, pincode: form.pincode, landmark: form.landmark },
          payment_method: paymentMethod, status: "pending"
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to place order")
      localStorage.setItem(SAVED_ADDRESS_KEY, JSON.stringify({ fullName: form.fullName, phone: form.phone, email: form.email, address: form.address, city: form.city, state: form.state, pincode: form.pincode, landmark: form.landmark }))
      const mode = new URLSearchParams(window.location.search).get("mode")
      if (mode === "buynow") sessionStorage.removeItem("buy_now_item")
      else { localStorage.setItem("cart", "[]"); window.dispatchEvent(new Event("cart-change")) }
      const ids = data.orders ? data.orders.map((o: any) => o.id) : [data.order?.id || "ORD" + Date.now()]
      setOrderIds(ids)
      setOrdered(true)
    } catch (err: any) { alert(err.message || "Something went wrong.") }
    finally { setLoading(false) }
  }

  if (ordered) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h1>
            <p className="text-gray-500 text-sm mb-1">Your order has been confirmed.</p>
            <div className="mb-2 space-y-1">
              {orderIds.map((id, i) => (
                <p key={id} className="text-xs text-gray-400">
                  {orderIds.length > 1 ? `Order ${i + 1}: ` : "Order ID: "}
                  <span className="font-mono text-gray-700 font-semibold">{id.slice(0, 8).toUpperCase()}</span>
                </p>
              ))}
            </div>
            <p className="text-xs text-gray-400 mb-6">Delivering to: <span className="font-medium text-gray-600">{form.address}, {form.city}, {form.state} - {form.pincode}</span></p>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-center gap-2 mb-1">
                <Truck className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-semibold text-amber-800">{paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}</p>
              </div>
              <p className="text-xs text-amber-700">{paymentMethod === "cod" ? `Keep ₹${totalPrice.toLocaleString("en-IN")} ready when your order arrives.` : "Payment will be collected at delivery."}</p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={() => router.push("/orders")} className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">Track My Order</button>
              <button onClick={() => router.push("/search")} className="w-full py-3 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">Continue Shopping</button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">

            {/* Step 1 — Address */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Deliver To</p>

              {/* Primary address dropdown */}
              {!editingAddress && (
                <div className="relative">
                  <div
                    onClick={() => setAddressDropdownOpen(v => !v)}
                    className={`flex items-center justify-between py-2 cursor-pointer transition-colors`}>
                    {savedAddress ? (
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{form.fullName}</p>
                        <p className="text-xs text-gray-900">{form.phone}</p>
                        <p className="text-xs text-gray-900 truncate">{form.address}, {form.city}, {form.state} - {form.pincode}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 flex-1">Select or add a delivery address</p>
                    )}
                    <svg className={`h-4 w-4 text-gray-400 ml-3 shrink-0 transition-transform ${addressDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Dropdown list */}
                  {addressDropdownOpen && (
                    <div className="mt-2 border border-gray-200 rounded-xl bg-white shadow-lg overflow-hidden z-10">
                      {allAddresses.map((addr, i) => {
                        const isSelected = savedAddress?.pincode === addr.pincode && savedAddress?.address === addr.address
                        return (
                          <div key={i} className={`flex items-start gap-3 p-3 border-b border-gray-50 transition-colors cursor-pointer ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}`}
                            onClick={() => { setForm(f => ({ ...f, ...addr })); setSavedAddress(addr); localStorage.setItem(SAVED_ADDRESS_KEY, JSON.stringify(addr)); setAddressDropdownOpen(false) }}>
                            <input type="radio" readOnly checked={isSelected} className="mt-1 accent-blue-600 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900">{addr.fullName}
                                {isSelected && <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Selected</span>}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">{addr.address}, {addr.city}, {addr.state} - {addr.pincode}</p>
                              <p className="text-xs text-gray-400">{addr.phone}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                              <button onClick={() => { setForm({ ...addr }); setAddressDropdownOpen(false); setEditingAddress(true); const upd = allAddresses.filter((_, idx) => idx !== i); setAllAddresses(upd); localStorage.setItem(ALL_ADDRESSES_KEY, JSON.stringify(upd)) }}
                                className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => {
                                const upd = allAddresses.filter((_, idx) => idx !== i)
                                setAllAddresses(upd); localStorage.setItem(ALL_ADDRESSES_KEY, JSON.stringify(upd))
                                if (isSelected) { setSavedAddress(upd[0] || null); if (upd[0]) { setForm(f => ({ ...f, ...upd[0] })); localStorage.setItem(SAVED_ADDRESS_KEY, JSON.stringify(upd[0])) } else localStorage.removeItem(SAVED_ADDRESS_KEY) }
                              }} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </div>
                        )
                      })}
                      <button onClick={() => { setAddressDropdownOpen(false); setEditingAddress(true); setForm(f => ({ ...f, address: "", city: "", state: "", pincode: "", landmark: "" })) }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 transition-colors font-medium">
                        <Plus className="h-4 w-4" /> Add New Address
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* No address yet */}
              {!savedAddress && !editingAddress && allAddresses.length === 0 && (
                <button onClick={() => setEditingAddress(true)} className="mt-2 w-full border-2 border-dashed border-gray-200 rounded-xl p-4 text-sm text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors font-medium">
                  + Add Delivery Address
                </button>
              )}

              {/* Add / Edit address form */}
              {editingAddress && (
                <div className="border border-blue-200 rounded-xl p-4 space-y-4 bg-blue-50/30">
                  <p className="text-sm font-semibold text-gray-700">New Address</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Full Name *" error={errors.fullName}>
                      <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} className={inputCls(errors.fullName)} placeholder="Full name" />
                    </Field>
                    <Field label="Phone *" error={errors.phone}>
                      <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls(errors.phone)} placeholder="10-digit number" maxLength={10} />
                    </Field>
                  </div>
                  <Field label="Address *" error={errors.address}>
                    <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={2} className={inputCls(errors.address) + " resize-none"} placeholder="House No, Street, Area..." />
                  </Field>
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="City *" error={errors.city}>
                      <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className={inputCls(errors.city)} placeholder="City" />
                    </Field>
                    <Field label="Pincode *" error={errors.pincode}>
                      <input value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} className={inputCls(errors.pincode)} placeholder="Pincode" maxLength={6} />
                    </Field>
                    <Field label="State *" error={errors.state}>
                      <select value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className={inputCls(errors.state)}>
                        <option value="">State</option>
                        {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </Field>
                  </div>
                  <Field label="Landmark (optional)">
                    <input value={form.landmark} onChange={e => setForm(f => ({ ...f, landmark: e.target.value }))} className={inputCls()} placeholder="Near temple, school..." />
                  </Field>
                  <div className="flex gap-2">
                    <button onClick={() => { setSaveThisAddress(true); saveAddressAndContinue() }}
                      className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                      Save & Use
                    </button>
                    {(allAddresses.length > 0 || savedAddress) && (
                      <button onClick={() => { setEditingAddress(false); setAddressDropdownOpen(false) }} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2 — Payment */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-4">Payment method</p>
              <div className="space-y-2">

                {/* Credit/Debit Card */}
                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-not-allowed opacity-50 border-gray-200`}>
                  <input type="radio" disabled className="accent-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Credit or Debit Card</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {["VISA","MC","AMEX","RuPay"].map(b => (
                        <span key={b} className="text-[10px] border border-gray-200 px-1.5 py-0.5 rounded font-bold text-gray-500">{b}</span>
                      ))}
                    </div>
                  </div>
                
                </label>

                {/* Net Banking */}
                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-not-allowed opacity-50 border-gray-200`}>
                  <input type="radio" disabled className="accent-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Net Banking</p>
                    <p className="text-xs text-gray-400">All major banks supported</p>
                  </div>
                
                </label>

                {/* UPI */}
                <label className={`flex items-center gap-3 p-3 rounded-lg border ${upiUnavailable ? "cursor-not-allowed opacity-50 border-gray-200" : paymentMethod === "upi" ? "border-blue-500 bg-blue-50 cursor-pointer" : "border-gray-200 cursor-pointer hover:border-gray-300"}`}>
                  <input type="radio" name="payment" value="upi" disabled={upiUnavailable}
                    checked={paymentMethod === "upi"} onChange={() => !upiUnavailable && setPaymentMethod("upi")} className="accent-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">UPI</p>
                    <p className="text-xs text-gray-400">GPay, PhonePe, Paytm, BHIM</p>
                  </div>
                  {upiUnavailable && <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full">Unavailable above ₹1L</span>}
                </label>

                {/* EMI */}
                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-not-allowed opacity-50 border-gray-200`}>
                  <input type="radio" disabled className="accent-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">EMI</p>
                    <p className="text-xs text-gray-400">Easy monthly installments</p>
                  </div>
                
                </label>

                {/* COD */}
                <label className={`flex items-center gap-3 p-3 rounded-lg border ${codUnavailable ? "cursor-not-allowed opacity-50 border-gray-200" : paymentMethod === "cod" ? "border-blue-500 bg-blue-50 cursor-pointer" : "border-gray-200 cursor-pointer hover:border-gray-300"}`}>
                  <input type="radio" name="payment" value="cod" disabled={codUnavailable}
                    checked={paymentMethod === "cod"} onChange={() => !codUnavailable && setPaymentMethod("cod")} className="accent-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Cash on Delivery / Pay on Delivery</p>
                    <p className="text-xs text-gray-400">Cash, UPI and Cards accepted at door</p>
                    {codUnavailable && (
                      <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1"><Info className="h-3 w-3" /> Not available for orders above ₹{COD_LIMIT.toLocaleString("en-IN")}</p>
                    )}
                  </div>

                </label>
              </div>


            </div>


          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 sticky top-24 space-y-3">
              {/* Product list */}
              <div className="space-y-2 pb-3 border-b border-gray-100">
                {cartItems.map(item => (
                  <div key={`${item.id}-${item.size}`} className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-100">
                      {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Package className="h-3 w-3 text-gray-300" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug">{item.name}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-xs font-semibold text-gray-900 shrink-0">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                  </div>
                ))}
              </div>
              {/* Order Summary */}
              <div className="space-y-2 pb-3 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-900">Order Summary</p>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Items ({totalItems}):</span>
                  <span>₹{totalPrice.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Delivery:</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
                <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Order Total:</span>
                  <span>₹{totalPrice.toLocaleString("en-IN")}</span>
                </div>
              </div>
              {/* Place Order */}
              {codUnavailable && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-red-600">
                  COD not available above ₹{COD_LIMIT.toLocaleString("en-IN")}. Please use another payment method.
                </div>
              )}
              <button
                onClick={placeOrder}
                disabled={loading || editingAddress || !paymentMethod || !savedAddress}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Placing Order...</> : "Place your order"}
              </button>
              <p className="text-[10px] text-gray-400 text-center">By placing your order, you agree to Partly's Terms & Conditions</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}