const express = require('express')
const router = express.Router()
const supabase = require('../supabase')
const authMiddleware = require('../middleware/auth')

// Helpers
const toPaise   = (r) => (r == null || r === '') ? null : Math.round(parseFloat(r) * 100)
const toRupees  = (p) => (p == null) ? null : p / 100
const toKwArray = (kw) => {
  if (!kw) return []
  if (Array.isArray(kw)) return kw.filter(Boolean)
  return kw.split(',').map(s => s.trim()).filter(Boolean)
}

const fmt = (p, details) => {
  if (!p) return null
  return {
    ...p,
    name:           p.title,
    price:          toRupees(p.price_paise),
    original_price: toRupees(p.original_price_paise),
    image:          p.thumbnail,
    vehicle_make:   p.fitment_make,
    vehicle_model:  p.fitment_model,
    vehicle_year:   p.fitment_year_from,
    status:         p.status === 'active' ? 'Published' : p.status,
    freeShipping:   p.free_shipping || false,
    fastShipping:   p.fast_shipping || false,
    free_shipping:  p.free_shipping || false,
    fast_shipping:  p.fast_shipping || false,
    minStock:       p.min_stock || 0,
    maxStock:       p.max_stock || 0,
    min_stock:      p.min_stock || 0,
    max_stock:      p.max_stock || 0,
    ...(details ? {
      description:    details.description || null,
      images:         details.images || [],
      part_number:    details.part_number || null,
      keywords:       Array.isArray(details.keywords) ? details.keywords.join(', ') : (details.keywords || ''),
      material:       details.material || null,
      colour:         details.colour || null,
      weight:         details.weight || null,
      weight_unit:    details.weight_unit || null,
      measurements:   details.measurements || null,
      size:           details.size || null,
      size_chart:     details.size_chart || null,
      warranty:       details.warranty || null,
      warranty_terms: details.warranty_terms || null,
      includes:       details.includes || null,
      features:       details.features || null,
      fitment:        details.fitment_raw || null,
      allow_make_offer: details.allow_make_offer !== false,
      vehicle_type:   details.vehicle_type || [],
      custom_fields:  details.custom_fields || [],
      customFields:   details.custom_fields || [],
    } : { images: [] }),
  }
}

const LIST_COLS = 'id,seller_id,shop_id,title,price_paise,original_price_paise,discount_percent,thumbnail,brand,category,status,part_type,condition,stock,min_stock,max_stock,flair_tag,free_shipping,fast_shipping,fitment_make,fitment_model,fitment_year_from,location,pincode,state_code,shop_name,shop_username,shop_logo_url,seller_username,has_accepted_offer,created_at'


// GET / — all active products (public)
router.get('/', async (req, res) => {
  try {
    const { limit, category, condition } = req.query
    let query = supabase
      .from('products')
      .select(LIST_COLS)
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (category)  query = query.eq('category', category)
    if (condition) query = query.eq('condition', condition)
    if (limit)     query = query.limit(parseInt(limit))

    const { data: products, error } = await query
    if (error) throw error
    res.json({ products: (products || []).map(p => fmt(p)) })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})


// GET /search — hybrid search: rule-based parser + fn_search_products RPC + individual listings
router.get('/search', async (req, res) => {
  try {
    const { q, condition, filterBrand, filterMake, filterModel, filterYear, minPrice, maxPrice, nearbyFirst, pincode, state, page = 1, limit = 24 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)

    if (!q && !filterMake) return res.json({ products: [], total: 0, parsed: {} })

    // Parse query to extract vehicle info
    const { parseSearchQuery } = require('../utils/searchParser')
    const parsed = q ? await parseSearchQuery(q, process.env.ANTHROPIC_API_KEY) : {}

    // Merge parsed results with explicit filters (explicit filters win)
    const resolvedMake  = filterMake  || parsed.make  || null
    const resolvedModel = filterModel || parsed.model || null
    const resolvedYear  = filterYear  ? parseInt(filterYear) : parsed.year || null
    const resolvedCondition = condition && condition !== 'all'
      ? condition
      : parsed.condition || null

    // Use cleanQuery for full text search (vehicle info stripped out)
    const searchQuery = parsed.cleanQuery || q || null

    const { data: products, error } = await supabase.rpc('fn_search_products', {
      p_query:        searchQuery,
      p_make:         resolvedMake,
      p_model:        resolvedModel,
      p_year:         resolvedYear,
      p_condition:    resolvedCondition,
      p_pincode:      pincode || null,
      p_state:        state   || null,
      p_nearby_first: nearbyFirst === 'true' || nearbyFirst === true,
      p_limit:        parseInt(limit),
      p_offset:       offset
    })

    if (error) throw error

    let results = products || []
    if (filterBrand) results = results.filter(p => p.brand?.toLowerCase() === filterBrand.toLowerCase())
    if (minPrice)    results = results.filter(p => p.price_paise >= toPaise(minPrice))
    if (maxPrice)    results = results.filter(p => p.price_paise <= toPaise(maxPrice))

    const mappedProducts = results.map(p => fmt(p))

    // Also fetch individual listings if not filtering for new only
    let individualListings = []
    if (resolvedCondition !== 'new' && q) {
      const now = new Date().toISOString()
      const searchTerms = (searchQuery || q).trim().split(/\s+/).filter(Boolean)
      const ilOr = searchTerms.flatMap(term => [
        `title.ilike.%${term}%`, `brand.ilike.%${term}%`,
        `description.ilike.%${term}%`, `vehicle_model.ilike.%${term}%`
      ]).join(',')
      if (ilOr) {
        const { data: ilData } = await supabase
          .from('individual_listings')
          .select('id, title, price, original_price, images, brand, category, vehicle_model, condition, location')
          .eq('status', 'Published')
          .or(`expires_at.is.null,expires_at.gt.${now}`)
          .or(ilOr)
          .limit(10)
        if (ilData) {
          individualListings = ilData.map(il => ({
            id: il.id, name: il.title, price: il.price,
            originalPrice: il.original_price || il.price,
            image: il.images?.[0] || null, images: il.images || [],
            condition: il.condition || 'used', brand: il.brand || '',
            category: il.category || '', vehicle_make: il.vehicle_model || '',
            location: il.location || '', isIndividualListing: true,
            status: 'Published', partType: 'used'
          }))
        }
      }
    }

    res.json({
      products: [...mappedProducts, ...individualListings],
      total: results.length,
      parsed: {
        make: resolvedMake,
        model: resolvedModel,
        year: resolvedYear,
        condition: resolvedCondition,
        cleanQuery: searchQuery
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})



// GET /:id/related
router.get('/:id/related', async (req, res) => {
  try {
    const { category, brand } = req.query
    let query = supabase
      .from('products')
      .select(LIST_COLS)
      .eq('status', 'active')
      .is('deleted_at', null)
      .neq('id', req.params.id)
      .or('stock.gt.0,condition.eq.used')
      .limit(6)
    if (category) query = query.eq('category', category)
    else if (brand) query = query.eq('brand', brand)
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    res.json({ products: (data || []).map(p => fmt(p)) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// GET /:id — single product with details
router.get('/:id', async (req, res) => {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select(LIST_COLS + ',oem_number,part_position,fitment_year_to,fitment_universal,view_count')
      .eq('id', req.params.id)
      .is('deleted_at', null)
      .maybeSingle()

    if (error) throw error
    if (!product) return res.status(404).json({ error: 'Product not found' })

    const { data: details } = await supabase
      .from('product_details')
      .select('description,images,part_number,keywords,material,colour,weight,weight_unit,measurements,size,size_chart,warranty,warranty_terms,includes,features,fitment_raw,allow_make_offer,vehicle_type,custom_fields')
      .eq('product_id', product.id)
      .maybeSingle()

    supabase.from('products').update({ view_count: (product.view_count || 0) + 1 }).eq('id', product.id).then(() => {})

    res.json({ product: fmt(product, details) })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})


// POST / — add product (sellers only)
router.post('/', authMiddleware, async (req, res) => {
  const {
    name, title,
    description, price, original_price,
    category, condition, brand, part_type,
    vehicle_make, vehicle_model, vehicle_year,
    fitment_make, fitment_model, fitment_year_from,
    image, images, photos,
    location, pincode, state,
    stock, shop_id, status, flair_tag,
    part_number, sku, keywords,
    oem_number, part_position,
    min_stock, minStock,
    max_stock, maxStock,
    material, colour,
    weight, weight_unit,
    measurements, size, size_chart,
    fitment, fitment_raw,
    warranty, warranty_terms,
    includes, features,
    allow_make_offer,
    vehicle_type,
    free_shipping, freeShipping,
    fast_shipping, fastShipping,
    custom_fields, customFields,
  } = req.body

  try {
    const resolvedTitle = (title || name || '').trim()
    if (!resolvedTitle) return res.status(400).json({ error: 'Product title is required' })

    let resolvedMake  = fitment_make  || vehicle_make  || null
    let resolvedModel = fitment_model || vehicle_model || null
    let resolvedYear  = fitment_year_from || vehicle_year  || null

    // Normalize fitment (fix typos: "honda citi 2019" → "Honda City 2019")
    if (resolvedMake || resolvedModel) {
      try {
        const { normalizeFitment } = require('../utils/searchParser')
        const normalized = await normalizeFitment(
          { make: resolvedMake, model: resolvedModel, year: resolvedYear },
          process.env.ANTHROPIC_API_KEY
        )
        if (normalized.make)  resolvedMake  = normalized.make
        if (normalized.model) resolvedModel = normalized.model
        if (normalized.year)  resolvedYear  = normalized.year
      } catch (e) {
        console.error('Fitment normalization failed:', e.message)
      }
    }

    const cover    = (typeof image === 'string' && image && !image.startsWith('blob:')) ? image : null
    const gallery  = (Array.isArray(images) ? images : Array.isArray(photos) ? photos : [])
      .filter(u => typeof u === 'string' && u.trim() && !u.startsWith('blob:'))

    const { data: shop } = await supabase.from('shops').select('id,shop_name,shop_username,logo_url').eq('user_id', req.user.id).maybeSingle()
    const { data: seller } = await supabase.from('users').select('username').eq('id', req.user.id).single()

    const resolvedCondition = (() => {
      const c = (condition || 'new').toLowerCase()
      if (c.startsWith('refurbish')) return 'refurbished'
      if (c.startsWith('used') || c === 'old') return 'used'
      return 'new'
    })()
    const resolvedListingType = resolvedCondition !== 'new' ? 'used_part' : 'new_part'

    const { data: product, error } = await supabase
      .from('products')
      .insert([{
        seller_id:            req.user.id,
        shop_id:              shop_id || shop?.id || null,
        title:                resolvedTitle,
        price_paise:          toPaise(price),
        original_price_paise: toPaise(original_price) || toPaise(price),
        thumbnail:            cover,
        category:             category || null,
        condition:            resolvedCondition,
        brand:                brand || null,
        part_type:            part_type || null,
        oem_number:           oem_number || null,
        part_position:        part_position || null,
        fitment_make:         resolvedMake,
        fitment_model:        resolvedModel,
        fitment_year_from:    resolvedYear ? parseInt(resolvedYear) : null,
        fitment_universal:    !resolvedMake,
        location:             location || null,
        pincode:              pincode || null,
        state_code:           state   || null,
        stock:                parseInt(stock) || 1,
        min_stock:            Math.trunc(Number(min_stock ?? minStock)) || 0,
        max_stock:            Math.trunc(Number(max_stock ?? maxStock)) || 0,
        listing_type:         resolvedListingType,
        flair_tag:            flair_tag || null,
        free_shipping:        !!(free_shipping ?? freeShipping),
        fast_shipping:        !!(fast_shipping ?? fastShipping),
        status:               status === 'Draft' ? 'draft' : 'active',
        published_at:         status === 'Draft' ? null : new Date().toISOString(),
        seller_username:      seller?.username || null,
        shop_name:            shop?.shop_name     || null,
        shop_username:        shop?.shop_username || null,
        shop_logo_url:        shop?.logo_url      || null,
      }])
      .select()
      .single()

    if (error) throw error

    const { error: dErr } = await supabase
      .from('product_details')
      .upsert({
        product_id:      product.id,
        description:     description || null,
        images:          gallery,
        part_number:     part_number || null,
        sku:             sku || null,
        keywords:        toKwArray(keywords),
        material:        material || null,
        colour:          colour || null,
        weight:          weight ? parseFloat(weight) : null,
        weight_unit:     weight_unit || null,
        measurements:    measurements || null,
        size:            size || null,
        size_chart:      size_chart || null,
        fitment_raw:     fitment_raw || fitment || null,
        warranty:        warranty || null,
        warranty_terms:  warranty_terms || null,
        includes:        includes || null,
        features:        features || null,
        allow_make_offer: allow_make_offer !== false,
        vehicle_type:    Array.isArray(vehicle_type) ? vehicle_type : [],
        custom_fields:   Array.isArray(customFields ?? custom_fields) ? (customFields ?? custom_fields) : [],
      }, { onConflict: 'product_id' })

    if (dErr) console.error('product_details insert error:', dErr)

    res.status(201).json({
      message: 'Product added successfully',
      product: fmt(product, {
        description, images: gallery, part_number,
        keywords: toKwArray(keywords),
        material, colour, weight, weight_unit, measurements,
        size, size_chart, warranty, warranty_terms,
        includes, features,
        fitment_raw: fitment_raw || fitment,
        allow_make_offer, vehicle_type,
        custom_fields: customFields ?? custom_fields ?? [],
      })
    })
  } catch (error) {
    console.error('add product error:', error)
    res.status(500).json({ error: error.message })
  }
})


// PUT /:id — update product (seller only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const {
      name, title,
      price, original_price,
      category, condition, brand, part_type,
      vehicle_make, vehicle_model, vehicle_year,
      fitment_make, fitment_model, fitment_year_from,
      image, images, photos,
      location, pincode, state,
      stock, flair_tag, status,
      part_number, sku, keywords, description,
      oem_number, part_position,
      min_stock, minStock,
      max_stock, maxStock,
      material, colour,
      weight, weight_unit,
      measurements, size, size_chart,
      fitment, fitment_raw,
      warranty, warranty_terms,
      includes, features,
      allow_make_offer,
      vehicle_type,
      free_shipping, freeShipping,
      fast_shipping, fastShipping,
      custom_fields, customFields,
    } = req.body

    const nn = (v) => (v === '' ? null : v)
    const updates = {}

    const resolvedTitle = title || name
    if (resolvedTitle  !== undefined) updates.title                 = resolvedTitle
    if (price          !== undefined) updates.price_paise           = toPaise(price)
    if (original_price !== undefined) {
      const opPaise = toPaise(original_price)
      updates.original_price_paise = opPaise || updates.price_paise || toPaise(price)
    }
    if (category       !== undefined) updates.category    = nn(category)
    if (condition !== undefined) {
      const c = (condition || 'new').toLowerCase()
      updates.condition = c.startsWith('refurbish') ? 'refurbished' : c.startsWith('used') ? 'used' : 'new'
      updates.listing_type = updates.condition !== 'new' ? 'used_part' : 'new_part'
    }
    if (brand          !== undefined) updates.brand       = nn(brand)
    if (part_type      !== undefined) updates.part_type   = nn(part_type)
    if (oem_number     !== undefined) updates.oem_number  = nn(oem_number)
    if (part_position  !== undefined) updates.part_position = nn(part_position)
    if (stock     !== undefined) updates.stock     = parseInt(stock) || 0
    const resolvedMinStock = min_stock ?? minStock
    const resolvedMaxStock = max_stock ?? maxStock
    if (resolvedMinStock !== undefined) updates.min_stock = Math.trunc(Number(resolvedMinStock)) || 0
    if (resolvedMaxStock !== undefined) updates.max_stock = Math.trunc(Number(resolvedMaxStock)) || 0
    if (flair_tag      !== undefined) updates.flair_tag   = nn(flair_tag)
    if (location       !== undefined) updates.location    = nn(location)
    if (pincode        !== undefined) updates.pincode     = nn(pincode)
    if (state          !== undefined) updates.state_code  = nn(state)

    const resolvedFreeShipping = free_shipping ?? freeShipping
    const resolvedFastShipping = fast_shipping ?? fastShipping
    if (resolvedFreeShipping !== undefined) updates.free_shipping = !!resolvedFreeShipping
    if (resolvedFastShipping !== undefined) updates.fast_shipping = !!resolvedFastShipping

    let resolvedMake  = fitment_make  ?? vehicle_make  ?? undefined
    let resolvedModel = fitment_model ?? vehicle_model ?? undefined
    let resolvedYear  = fitment_year_from ?? vehicle_year ?? undefined

    // Normalize fitment if any field was provided
    if (resolvedMake !== undefined || resolvedModel !== undefined) {
      try {
        const { normalizeFitment } = require('../utils/searchParser')
        const normalized = await normalizeFitment(
          { make: resolvedMake, model: resolvedModel, year: resolvedYear },
          process.env.ANTHROPIC_API_KEY
        )
        if (resolvedMake  !== undefined && normalized.make)  resolvedMake  = normalized.make
        if (resolvedModel !== undefined && normalized.model) resolvedModel = normalized.model
        if (resolvedYear  !== undefined && normalized.year)  resolvedYear  = normalized.year
      } catch (e) {
        console.error('Fitment normalization failed:', e.message)
      }
    }

    if (resolvedMake  !== undefined) updates.fitment_make      = resolvedMake
    if (resolvedModel !== undefined) updates.fitment_model     = resolvedModel
    if (resolvedYear  !== undefined) updates.fitment_year_from = resolvedYear ? parseInt(resolvedYear) : null

    if (status !== undefined) {
      updates.status = status === 'Published' ? 'active' : status === 'Draft' ? 'draft' : status
      if (updates.status === 'active') updates.published_at = new Date().toISOString()
    }

    const imageFieldSent = image !== undefined || images !== undefined || photos !== undefined
    let cover = undefined, gallery = undefined
    if (imageFieldSent) {
      cover   = (typeof image === 'string' && image && !image.startsWith('blob:')) ? image : null
      gallery = (Array.isArray(images) ? images : Array.isArray(photos) ? photos : [])
        .filter(u => typeof u === 'string' && u.trim() && !u.startsWith('blob:'))
      updates.thumbnail = cover
    }

    const { data: product, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', req.params.id)
      .eq('seller_id', req.user.id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) throw error

    const detailSent = description !== undefined || gallery !== undefined ||
      part_number !== undefined || sku !== undefined || keywords !== undefined ||
      material !== undefined || colour !== undefined || weight !== undefined ||
      measurements !== undefined || size !== undefined || size_chart !== undefined ||
      fitment !== undefined || fitment_raw !== undefined ||
      warranty !== undefined || warranty_terms !== undefined ||
      includes !== undefined || features !== undefined ||
      allow_make_offer !== undefined || vehicle_type !== undefined ||
      customFields !== undefined || custom_fields !== undefined

    if (detailSent) {
      const d = { product_id: req.params.id }
      if (description    !== undefined) d.description    = description
      if (gallery        !== undefined) d.images         = gallery
      if (part_number    !== undefined) d.part_number    = part_number
      if (sku            !== undefined) d.sku            = sku
      if (keywords       !== undefined) d.keywords       = toKwArray(keywords)
      if (material       !== undefined) d.material       = material || null
      if (colour         !== undefined) d.colour         = colour || null
      if (weight         !== undefined) d.weight         = weight ? parseFloat(weight) : null
      if (weight_unit    !== undefined) d.weight_unit    = weight_unit || null
      if (measurements   !== undefined) d.measurements   = measurements || null
      if (size           !== undefined) d.size           = size || null
      if (size_chart     !== undefined) d.size_chart     = size_chart || null
      if (fitment_raw    !== undefined || fitment !== undefined) d.fitment_raw = fitment_raw || fitment || null
      if (warranty       !== undefined) d.warranty       = warranty || null
      if (warranty_terms !== undefined) d.warranty_terms = warranty_terms || null
      if (includes       !== undefined) d.includes       = includes || null
      if (features       !== undefined) d.features       = features || null
      if (allow_make_offer !== undefined) d.allow_make_offer = allow_make_offer !== false
      if (vehicle_type   !== undefined) d.vehicle_type   = Array.isArray(vehicle_type) ? vehicle_type : []
      const resolvedCustomFields = customFields ?? custom_fields
      if (resolvedCustomFields !== undefined) d.custom_fields = Array.isArray(resolvedCustomFields) ? resolvedCustomFields : []
      const { error: dErr } = await supabase.from('product_details').upsert(d, { onConflict: 'product_id' })
      if (dErr) console.error('product_details update error:', dErr)
    }

    res.json({
      message: 'Product updated',
      product: fmt(product, gallery !== undefined ? { images: gallery } : undefined)
    })
  } catch (error) {
    console.error('update product error:', error)
    res.status(500).json({ error: error.message })
  }
})


// DELETE /:id — soft delete (seller only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase
      .from('products')
      .update({ deleted_at: new Date().toISOString(), status: 'deleted' })
      .eq('id', req.params.id)
      .eq('seller_id', req.user.id)
    if (error) throw error
    res.json({ message: 'Product deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})


module.exports = router