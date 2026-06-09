const express = require('express')
const router = express.Router()
const supabase = require('../supabase')
const authMiddleware = require('../middleware/auth')

// GET /api/requests — get all part requests (public)
router.get('/', async (req, res) => {
  try {
    const now = new Date().toISOString()

    // Run requests + interests queries in parallel
    const [{ data, error }, { data: interests }] = await Promise.all([
      supabase
        .from('part_requests')
        .select('id, user_id, title, part_name, fitment_make, fitment_model, fitment_variant, fitment_year, engine, part_position, quantity, oem_number, condition_preference, location, pincode, delivery, budget_paise, notes, images, created_at, expires_at, is_paid, status, bumped_at, users(full_name, username, avatar_url)', { count: 'exact' })
        .is('deleted_at', null)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('bumped_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false })
        .range(parseInt(req.query.offset || 0), parseInt(req.query.offset || 0) + parseInt(req.query.limit || 30) - 1),
      supabase
        .from('part_request_interests')
        .select('request_id, seller_id')
    ])

    if (error) throw error

    const requests = data || []
    const allInterests = interests || []

    // Get unique user IDs from interests
    const userIds = [...new Set(allInterests.map(i => i.seller_id))]
    let userMap = {}

    if (userIds.length > 0) {
      const { data: userDetails } = await supabase
        .from('users')
        .select('id, full_name, username, avatar_url')
        .in('id', userIds)
      if (userDetails) userDetails.forEach(u => { userMap[u.id] = u })
    }

    // Build interest maps
    const interestMap = {}
    const interestedUsersMap = {}
    allInterests.forEach(i => {
      if (!interestMap[i.request_id]) interestMap[i.request_id] = 0
      interestMap[i.request_id]++
      if (!interestedUsersMap[i.request_id]) interestedUsersMap[i.request_id] = []
      const u = userMap[i.seller_id] || {}
      interestedUsersMap[i.request_id].push({ user_id: i.seller_id, full_name: u.full_name || '', username: u.username || '', avatar_url: u.avatar_url || null })
    })

    const result = requests.map(r => ({
      ...r,
      // Map new schema → old field names for frontend
      car_make:      r.fitment_make,
      car_model:     r.fitment_model,
      variant:       r.fitment_variant,
      car_year:      r.fitment_year,
      budget:        r.budget_paise != null ? r.budget_paise / 100 : null,
      image_url:     r.images?.[0] || null,
      interest_count: interestMap[r.id] || 0,
      interested_users: interestedUsersMap[r.id] || []
    }))

    res.json({ requests: result })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/requests/my-count — get user request count
router.get('/my-count', authMiddleware, async (req, res) => {
  try {
    const { count } = await supabase
      .from('part_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
    res.json({ count: count || 0, free_remaining: Math.max(0, 3 - (count || 0)) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/requests/:id/interests — get all interested users
router.get('/:id/interests', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('part_request_interests')
      .select('seller_id, users(full_name, username, avatar_url)')
      .eq('request_id', req.params.id)
    if (error) throw error
    res.json({ users: (data || []).map(i => ({ user_id: i.seller_id, ...i.users })) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/requests/:id — get single request with full images
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('part_requests')
      .select('*, users(full_name, username, avatar_url)')
      .eq('id', req.params.id)
      .single()
    if (error) throw error
    const mapped = data ? {
      ...data,
      car_make:  data.fitment_make,
      car_model: data.fitment_model,
      variant:   data.fitment_variant,
      car_year:  data.fitment_year,
      budget:    data.budget_paise != null ? data.budget_paise / 100 : null,
      image_url: data.images?.[0] || null,
    } : null
    res.json({ request: mapped })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/requests — create a new part request
router.post('/', authMiddleware, async (req, res) => {
  const { title, part_name, car_make, car_model, variant, car_year, engine, part_position, quantity, oem_number, condition_preference, modifications, location, pincode, delivery, budget, notes, image_url, images, is_paid } = req.body
  if (!title && !part_name) return res.status(400).json({ error: 'Title is required' })

  try {
    const { count } = await supabase
      .from('part_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)

    const totalCount = count || 0
    const isFree = totalCount < 3

    if (!isFree && !is_paid) {
      return res.status(402).json({ error: 'Free limit reached', requires_payment: true, cost: 10 })
    }

    const expiryDays = isFree ? 7 : 30
    const expires_at = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString()

    // Build images array — include image_url if provided (legacy single-image support)
    let imageArr = Array.isArray(images) ? images.filter(u => u && !u.startsWith('blob:')) : []
    if (image_url && !image_url.startsWith('blob:') && !imageArr.includes(image_url)) {
      imageArr.unshift(image_url)
    }

    const { data, error } = await supabase
      .from('part_requests')
      .insert([{
        user_id:              req.user.id,
        title:                title || part_name,
        part_name,
        part_position:        part_position || null,
        oem_number:           oem_number || null,
        fitment_make:         car_make || null,
        fitment_model:        car_model || null,
        fitment_year:         car_year ? parseInt(car_year) : null,
        fitment_variant:      variant || null,
        engine:               engine || null,
        condition_preference: condition_preference || 'any',
        budget_paise:         budget ? Math.round(parseFloat(budget) * 100) : null,
        quantity:             quantity ? parseInt(quantity) : 1,
        location:             location || null,
        pincode:              pincode || null,
        delivery:             delivery === true || delivery === 'true' || delivery === 'yes',
        notes:                notes || (modifications ? `Modifications: ${modifications}` : null),
        images:               imageArr,
        expires_at,
        is_paid:              !isFree,
      }])
      .select()
      .single()

    if (error) throw error
    res.status(201).json({ request: data, is_free: isFree, expires_at })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/requests/:id/interest — mark interest in a request
router.post('/:id/interest', authMiddleware, async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('part_request_interests')
      .select('id')
      .eq('request_id', req.params.id)
      .eq('seller_id', req.user.id)
      .single()

    if (existing) {
      await supabase.from('part_request_interests').delete().eq('id', existing.id)
      res.json({ interested: false })
    } else {
      await supabase.from('part_request_interests').insert([{ request_id: req.params.id, seller_id: req.user.id }])
      res.json({ interested: true })
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/requests/:id — delete own request
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await supabase.from('part_requests').delete().eq('id', req.params.id).eq('user_id', req.user.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/requests/:id/status — mark as fulfilled/open
router.patch('/:id/status', authMiddleware, async (req, res) => {
  const { status } = req.body
  if (!['open', 'fulfilled', 'closed'].includes(status)) return res.status(400).json({ error: 'Invalid status' })
  try {
    const { error } = await supabase
      .from('part_requests')
      .update({ status })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/requests/:id/bump — bump request to top (once per 24h)
router.post('/:id/bump', authMiddleware, async (req, res) => {
  try {
    const { data: rows } = await supabase
      .from('part_requests')
      .select('bumped_at, user_id')
      .eq('id', req.params.id)

    const existing = rows?.[0]
    if (!existing) return res.status(404).json({ error: 'Not found' })
    if (existing.user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' })

    const lastBump = existing.bumped_at ? new Date(existing.bumped_at) : null
    const hoursSince = lastBump ? (Date.now() - lastBump.getTime()) / (1000 * 60 * 60) : 999

    if (hoursSince < 4) {
      const hoursLeft = Math.ceil(4 - hoursSince)
      return res.status(429).json({ error: `You can bump again in ${hoursLeft} hour${hoursLeft > 1 ? 's' : ''}` })
    }

    const { error } = await supabase
      .from('part_requests')
      .update({ bumped_at: new Date().toISOString() })
      .eq('id', req.params.id)
    console.log('Bump update error:', error)
    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/requests/:id/notify-sellers — notify matching sellers
router.post('/:id/notify-sellers', authMiddleware, async (req, res) => {
  try {
    const { data: request } = await supabase
      .from('part_requests')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (!request) return res.status(404).json({ error: 'Not found' })

    const partName = request.part_name || request.title || ''
    const make = request.fitment_make || ''
    const model = request.fitment_model || ''

    const orParts = []
    if (partName) orParts.push(`title.ilike.%${partName}%`)
    if (make) orParts.push(`fitment_make.ilike.%${make}%`)
    if (model) orParts.push(`fitment_model.ilike.%${model}%`)
    const orQuery = orParts.join(',')

    const sellerIds = new Set()

    if (orQuery) {
      const { data: matchingProducts } = await supabase
        .from('products')
        .select('seller_id')
        .eq('status', 'active')
        .is('deleted_at', null)
        .neq('seller_id', req.user.id)
        .or(orQuery)
        .limit(20)
      ;(matchingProducts || []).forEach(p => sellerIds.add(p.seller_id))

      const ilOrParts = []
      if (partName) ilOrParts.push(`title.ilike.%${partName}%`)
      if (make || model) ilOrParts.push(`vehicle_model.ilike.%${make || model}%`)
      if (ilOrParts.length) {
        const { data: matchingListings } = await supabase
          .from('individual_listings')
          .select('user_id')
          .eq('status', 'Published')
          .neq('user_id', req.user.id)
          .or(ilOrParts.join(','))
          .limit(20)
        ;(matchingListings || []).forEach(l => sellerIds.add(l.user_id))
      }
    }

    const uniqueUserIds = [...sellerIds]
    if (uniqueUserIds.length === 0) return res.json({ notified: 0 })

    const notifications = uniqueUserIds.map(userId => ({
      user_id: userId,
      type: 'request_match',
      title: 'Someone needs a part you might have!',
      body: `A buyer is looking for: ${partName}${make ? ' for ' + make : ''}${model ? ' ' + model : ''}`,
      data: { request_id: request.id },
    }))

    await supabase.from('notifications').insert(notifications)
    res.json({ notified: uniqueUserIds.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router