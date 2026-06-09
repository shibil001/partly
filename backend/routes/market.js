const express = require('express')
const router = express.Router()
const supabase = require('../supabase')
const authMiddleware = require('../middleware/auth')

// GET /api/market/my-count
router.get('/my-count', authMiddleware, async (req, res) => {
  try {
    const { count } = await supabase
      .from('market_listings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
    res.json({ count: count || 0 })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/market — all listings
router.get('/', async (req, res) => {
  try {
    const { q, vehicle_type, fuel_type, min_price, max_price, year, sort, page = 1, limit = 20 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)

    let query = supabase
      .from('market_listings')
      .select('*, users(full_name, username, avatar_url)', { count: 'exact' })
      .eq('status', 'Published')

    // Search with fuzzy matching - split by words for partial matches
    if (q) {
      const words = q.trim().split(/\s+/)
      const orFilters = words.flatMap(w => [
        `title.ilike.%${w}%`,
        `make.ilike.%${w}%`,
        `model.ilike.%${w}%`,
        `location.ilike.%${w}%`
      ]).join(',')
      query = query.or(orFilters)
    }

    // Filters
    if (vehicle_type) query = query.eq('vehicle_type', vehicle_type)
    if (fuel_type) query = query.eq('fuel_type', fuel_type)
    if (year) query = query.eq('year', year)
    if (min_price) query = query.gte('price', Number(min_price))
    if (max_price) query = query.lte('price', Number(max_price))

    // Sort
    if (sort === 'price_asc') query = query.order('price', { ascending: true })
    else if (sort === 'price_desc') query = query.order('price', { ascending: false })
    else if (sort === 'km_asc') query = query.order('km_driven', { ascending: true })
    else query = query.order('created_at', { ascending: false })

    // Pagination
    query = query.range(offset, offset + parseInt(limit) - 1)

    const { data: vehicles, count, error } = await query
    if (error) throw error

    // Personalization score if logged in
    const authHeader = req.headers.authorization
    let sorted = vehicles || []
    if (authHeader && parseInt(page) === 1) {
      try {
        const token = authHeader.split(' ')[1]
        const { data: { user } } = await supabase.auth.getUser(token)
        if (user) {
          const { data: userData } = await supabase.from('users').select('location').eq('id', user.id).single()
          const userLocation = userData?.location?.toLowerCase()
          const { data: activity } = await supabase
            .from('market_activity').select('vehicle_type, make').eq('user_id', user.id)
            .order('created_at', { ascending: false }).limit(20)

          if ((activity && activity.length > 0) || userLocation) {
            const prefTypes = [...new Set((activity || []).map(a => a.vehicle_type).filter(Boolean))]
            const prefMakes = [...new Set((activity || []).map(a => a.make).filter(Boolean))]
            sorted = sorted.map(v => {
              let score = 0
              if (userLocation && v.location?.toLowerCase().includes(userLocation)) score += 10
              if (prefTypes.includes(v.vehicle_type)) score += 5
              if (prefMakes.includes(v.make)) score += 3
              return { ...v, _score: score }
            })
            sorted.sort((a, b) => b._score - a._score)
            sorted = sorted.map(({ _score, ...v }) => v)
          }
        }
      } catch {}
    }

    res.json({ vehicles: sorted, total: count || 0, page: parseInt(page), limit: parseInt(limit) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/market/user-location
router.get('/user-location', authMiddleware, async (req, res) => {
  try {
    const { data } = await supabase.from('users').select('location').eq('id', req.user.id).single()
    res.json({ location: data?.location || null })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/market/location
router.post('/location', authMiddleware, async (req, res) => {
  const { location } = req.body
  try {
    await supabase.from('users').update({ location }).eq('id', req.user.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/market/activity
router.post('/activity', authMiddleware, async (req, res) => {
  const { vehicle_type, make } = req.body
  try {
    await supabase.from('market_activity').insert([{ user_id: req.user.id, vehicle_type, make }])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/market/my
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('market_listings')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json({ vehicles: data || [] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/market/:id — single listing
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('market_listings')
      .select('*, users(full_name, username, avatar_url)')
      .eq('id', req.params.id)
      .single()
    if (error) throw error
    res.json({ vehicle: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/market — create listing
router.post('/', authMiddleware, async (req, res) => {
  const { title, vehicle_type, make, model, year, variant, fuel_type, transmission, km_driven, color, condition, price, location, description, images } = req.body
  if (!title || !make || !model || !year || !price || !condition) {
    return res.status(400).json({ error: 'Required fields missing' })
  }
  try {
    const { count } = await supabase
      .from('market_listings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)

    const isFree = (count || 0) < 1
    if (!isFree && !req.body.is_paid) {
      return res.status(402).json({ error: 'Free limit reached', requires_payment: true, cost: 99 })
    }

    const { data, error } = await supabase
      .from('market_listings')
      .insert([{
        user_id: req.user.id, title, vehicle_type: vehicle_type || null,
        make, model, year, variant: variant || null,
        fuel_type: fuel_type || null, transmission: transmission || null,
        km_driven: km_driven || null, color: color || null,
        condition, price: Number(price), location: location || null,
        description: description || null, images: images || [], video_url: req.body.video_url || null, noc_available: req.body.noc_available || null, engine: req.body.engine || null, owners: req.body.owners || null, registration_year: req.body.registration_year || null, rto_state: req.body.rto_state || null, mileage: req.body.mileage || null,
        status: 'Published', is_paid: !isFree
      }])
      .select().single()
    if (error) throw error
    res.status(201).json({ vehicle: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/market/:id — update listing
router.patch('/:id', authMiddleware, async (req, res) => {
  const { title, vehicle_type, make, model, year, variant, fuel_type, transmission, km_driven, color, condition, price, location, description, images } = req.body
  try {
    const { data, error } = await supabase
      .from('market_listings')
      .update({ title, vehicle_type, make, model, year, variant, fuel_type, transmission, km_driven, color, condition, price: Number(price), location, description, images, video_url: req.body.video_url || null, noc_available: req.body.noc_available || null, engine: req.body.engine || null, owners: req.body.owners || null, registration_year: req.body.registration_year || null, rto_state: req.body.rto_state || null, mileage: req.body.mileage || null })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select().single()
    if (error) throw error
    res.json({ vehicle: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/market/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await supabase.from('market_listings').delete().eq('id', req.params.id).eq('user_id', req.user.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router