import { createClient } from "@supabase/supabase-js"

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  }
)

// Auto-refresh tokens before they expire (Supabase tokens last 1 hour)
// Called once on app load — sets up a timer to refresh 5 minutes before expiry
async function setupTokenRefresh(tokenKey: string, refreshKey: string) {
  const token = localStorage.getItem(tokenKey)
  const refreshToken = localStorage.getItem(refreshKey)
  if (!token || !refreshToken) return

  try {
    // Decode JWT to find expiry (no verification needed — just reading the payload)
    const payload = JSON.parse(atob(token.split('.')[1]))
    const expiresAt = payload.exp * 1000  // convert to ms
    const refreshAt = expiresAt - 5 * 60 * 1000  // 5 minutes before expiry
    const delay = refreshAt - Date.now()

    if (delay <= 0) {
      // Already expired or about to — refresh now
      await refreshNow(tokenKey, refreshKey, refreshToken)
    } else {
      // Schedule refresh before expiry
      setTimeout(() => refreshNow(tokenKey, refreshKey, refreshToken), delay)
    }
  } catch {}
}

async function refreshNow(tokenKey: string, refreshKey: string, refreshToken: string) {
  try {
    // Get current user ID before refresh to verify after
    const currentToken = localStorage.getItem(tokenKey)
    let currentUserId: string | null = null
    if (currentToken) {
      try { currentUserId = JSON.parse(atob(currentToken.split('.')[1])).sub } catch {}
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    })
    if (res.ok) {
      const data = await res.json()
      if (data.token) {
        // Verify the refreshed token belongs to the same user
        // This prevents a stale refresh_token from overwriting a different user's session
        let refreshedUserId: string | null = null
        try { refreshedUserId = JSON.parse(atob(data.token.split('.')[1])).sub } catch {}

        if (currentUserId && refreshedUserId && currentUserId !== refreshedUserId) {
          // Stale refresh token from different user — clear it
          localStorage.removeItem(refreshKey)
          return
        }

        localStorage.setItem(tokenKey, data.token)
        if (data.refresh_token) localStorage.setItem(refreshKey, data.refresh_token)
        // Schedule next refresh
        setupTokenRefresh(tokenKey, refreshKey)
      }
    } else {
      // Refresh failed (expired) — clear tokens and redirect to login
      handleExpiredSession(tokenKey, refreshKey)
    }
  } catch {
    // Network error — don't log out, they may just be offline
    // Retry in 30 seconds
    setTimeout(() => refreshNow(tokenKey, refreshKey, refreshToken), 30 * 1000)
  }
}

function handleExpiredSession(tokenKey: string, refreshKey: string) {
  // Clear all auth data
  localStorage.removeItem(tokenKey)
  localStorage.removeItem(refreshKey)

  if (tokenKey === 'seller_token') {
    localStorage.removeItem('seller_user')
    localStorage.removeItem('seller_shop')
    // Redirect to seller login
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/seller')) {
      window.location.href = '/seller/login?reason=session_expired'
    }
  } else {
    localStorage.removeItem('user')
    // For buyers — just clear the token, don't force redirect
    // They'll be prompted to login when they try to do something
    window.dispatchEvent(new Event('auth-expired'))
  }
}

// Start auto-refresh for both buyer and seller tokens on load
if (typeof window !== 'undefined') {
  setupTokenRefresh('token', 'refresh_token')
  setupTokenRefresh('seller_token', 'seller_refresh_token')
}

export function mapProductToDb(product: any) {
  return {
    seller_id: product.seller_id || undefined,
    name: product.name,
    brand: product.brand,
    product_code: product.productCode,
    sku: product.sku,
    category: product.category,
    description: product.description || "",
    price: product.price,
    original_price: product.originalPrice,
    currency: product.currency || "INR",
    discount_percent: product.discountPercent,
    stock: Math.trunc(Number(product.stock)) || 0,
    stock_unit: product.stockUnit,
    min_stock: Math.trunc(Number(product.minStock)) || 0,
    max_stock: Math.trunc(Number(product.maxStock)) || 0,
    status: product.status,
    condition: product.condition || "new",
    // image = cover photo, images = remaining photos (cover is NOT duplicated in images array)
    image: product.image || "",
    images: Array.isArray(product.images) ? product.images : [],
    flair_tag: product.flairTag,
    free_shipping: product.freeShipping,
    fast_shipping: product.fastShipping,
    location: product.location,
    district: product.district || "",
    state: product.state || "",
    pincode: product.pincode || "",
    material: product.material,
    colour: product.colour,
    weight: product.weight,
    weight_unit: product.weightUnit,
    measurements: product.measurements,
    size: product.size,
    size_chart: product.sizeChart,
    keywords: product.keywords,
    fitment: product.fitment,
    warranty: product.warranty,
    warranty_terms: product.warrantyTerms,
    includes: product.includes,
    features: product.features,
    vehicle_make: product.vehicle_make || "",
    vehicle_model: product.vehicle_model || "",
    vehicle_year: product.vehicle_year || "",
    part_number: product.partNumber || "",
    allow_make_offer: product.allowMakeOffer !== false,
    allow_message: product.allowMessage !== false,
    // Used seller fields — map to new schema column names
    fitment_model: product.vehicleModel || product.vehicle_model || "",
    fitment_make: product.vehicleMake || product.vehicle_make || "",
    fitment_year_from: product.year || product.vehicle_year || null,
    part_type: product.partType || "new",
    custom_fields: product.customFields || [],
  }
}

export function mapDbToProduct(db: any) {
  return {
    id: db.id,
    name: db.name,
    brand: db.brand,
    productCode: db.product_code,
    sku: db.sku,
    category: db.category,
    description: db.description,
    price: db.price,
    originalPrice: db.original_price,
    currency: db.currency,
    discountPercent: db.discount_percent,
    stock: Math.trunc(Number(db.stock)) || 0,
    stockUnit: db.stock_unit,
    minStock: Math.trunc(Number(db.min_stock)) || 0,
    maxStock: Math.trunc(Number(db.max_stock)) || 0,
    status: db.status,
    condition: db.condition,
    image: db.image?.startsWith('blob:') ? '' : (db.image || ''),
    images: (db.images || []).filter((u: string) => u && !u.startsWith('blob:')),
    flairTag: db.flair_tag,
    freeShipping: db.free_shipping,
    fastShipping: db.fast_shipping,
    location: db.location,
    district: db.district || "",
    state: db.state_code || db.state || "",
    pincode: db.pincode || "",
    material: db.material,
    colour: db.colour,
    weight: db.weight,
    weightUnit: db.weight_unit,
    measurements: db.measurements,
    size: db.size,
    sizeChart: db.size_chart,
    keywords: db.keywords,
    fitment: db.fitment,
    warranty: db.warranty,
    warrantyTerms: db.warranty_terms,
    includes: db.includes,
    features: db.features,
    vehicle_make: db.fitment_make || "",
    vehicle_model: db.fitment_model || "",
    vehicle_year: db.fitment_year_from?.toString() || "",
    partNumber: db.part_number || db.sku || "",
    allowMakeOffer: db.allow_make_offer !== false,
    has_accepted_offer: db.has_accepted_offer || false,
    allowMessage: db.allow_message !== false,
    vehicleModel: db.fitment_model || db.vehicle_model_used || "",
    year: db.fitment_year_from?.toString() || "",
    partType: db.part_type || db.condition,
    customFields: db.custom_fields || [],
    createdAt: db.created_at,
    seller_id: db.seller_id,
  }
}