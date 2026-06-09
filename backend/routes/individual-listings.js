const express = require('express')
const router = express.Router()
const supabase = require('../supabase')
const authMiddleware = require('../middleware/auth')

// GET /api/individual-listings — public listings
router.get('/', async (req, res) => {
  try {
    const now = new Date().toISOString()
    const { q, category, condition, limit = 24, page = 1 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)

    let query = supabase
      .from('individual_listings')
      .select('*, users(full_name, username, avatar_url)', { count: 'exact' })
      .eq('status', 'Published')
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1)

    if (q)         query = query.ilike('title', `%${q}%`)
    if (category)  query = query.eq('category', category)
    if (condition) query = query.eq('condition', condition)

    const { data, count, error } = await query
    if (error) throw error
    res.json({ listings: data || [], total: count || 0 })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/my', authMiddleware, async (req, res) => {
  try {
    const { data, count, error } = await supabase
      .from('individual_listings')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json({ listings: data || [], count: count || 0 })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('individual_listings')
      .select('*, users(full_name, username, avatar_url)')
      .eq('id', req.params.id)
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Listing not found' })
    res.json({ listing: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', authMiddleware, async (req, res) => {
  const { title, description, price, original_price, condition, category, brand, partNumber, vehicleModel, year, fitment, material, colour, weight, measurements, includes, location, images, is_paid } = req.body
  if (!title || !price || !condition) return res.status(400).json({ error: 'Title, price and condition are required' })
  try {
    const { count } = await supabase.from('individual_listings').select('*', { count: 'exact', head: true }).eq('user_id', req.user.id)
    const isFree = (count || 0) < 3
    if (!isFree && !is_paid) return res.status(402).json({ error: 'Free limit reached', requires_payment: true, cost: 29 })
    const expires_at = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase.from('individual_listings').insert([{
      user_id: req.user.id, title, description: description || null, price: Number(price),
      original_price: original_price ? Number(original_price) : null, condition,
      category: category || null, brand: brand || null, part_number: partNumber || null,
      vehicle_model: vehicleModel || null, year: year || null, fitment: fitment || null,
      material: material || null, colour: colour || null, weight: weight || null,
      measurements: measurements || null, includes: includes || null, location: location || null,
      images: Array.isArray(images) ? images.filter(u => u && !u.startsWith('blob:')) : [],
      status: 'Published', expires_at, is_paid: !isFree,
    }]).select().single()
    if (error) throw error
    res.status(201).json({ listing: data })
  } catch (err) {
    console.error('individual-listings POST error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

router.patch('/:id', authMiddleware, async (req, res) => {
  const { title, description, price, original_price, condition, category, brand, partNumber, vehicleModel, year, fitment, material, colour, weight, measurements, includes, location, images } = req.body
  try {
    const updates = { updated_at: new Date().toISOString() }
    if (title        !== undefined) updates.title          = title
    if (description  !== undefined) updates.description    = description
    if (price        !== undefined) updates.price          = Number(price)
    if (original_price !== undefined) updates.original_price = original_price ? Number(original_price) : null
    if (condition    !== undefined) updates.condition      = condition
    if (category     !== undefined) updates.category       = category || null
    if (brand        !== undefined) updates.brand          = brand || null
    if (partNumber   !== undefined) updates.part_number    = partNumber || null
    if (vehicleModel !== undefined) updates.vehicle_model  = vehicleModel || null
    if (year         !== undefined) updates.year           = year || null
    if (fitment      !== undefined) updates.fitment        = fitment || null
    if (material     !== undefined) updates.material       = material || null
    if (colour       !== undefined) updates.colour         = colour || null
    if (weight       !== undefined) updates.weight         = weight || null
    if (measurements !== undefined) updates.measurements   = measurements || null
    if (includes     !== undefined) updates.includes       = includes || null
    if (location     !== undefined) updates.location       = location || null
    if (images       !== undefined) updates.images         = Array.isArray(images) ? images.filter(u => u && !u.startsWith('blob:')) : []
    const { data, error } = await supabase.from('individual_listings').update(updates).eq('id', req.params.id).eq('user_id', req.user.id).select().single()
    if (error) throw error
    res.json({ listing: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/:id/status', authMiddleware, async (req, res) => {
  const { status } = req.body
  try {
    const { data, error } = await supabase.from('individual_listings').update({ status, updated_at: new Date().toISOString() }).eq('id', req.params.id).eq('user_id', req.user.id).select().single()
    if (error) throw error
    res.json({ listing: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await supabase.from('individual_listings').delete().eq('id', req.params.id).eq('user_id', req.user.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router