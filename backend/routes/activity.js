const express = require('express')
const router = express.Router()
const supabase = require('../supabase')
const authMiddleware = require('../middleware/auth')

// GET /api/activity — recent activity for logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id

    // Recent orders — buyer_id, total_amount_paise
    const { data: orders } = await supabase
      .from('orders')
      .select('id, order_number, total_amount_paise, status, created_at')
      .eq('buyer_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5)

    // Recently viewed — join products with new column names
    const { data: viewed } = await supabase
      .from('recently_viewed')
      .select('product_id, viewed_at, products(id, title, price_paise, thumbnail)')
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(10)

    // Recent searches
    const { data: searches } = await supabase
      .from('recent_searches')
      .select('query, condition, searched_at')
      .eq('user_id', userId)
      .order('searched_at', { ascending: false })
      .limit(5)

    // Map to frontend shape
    const mappedOrders = (orders || []).map(o => ({
      ...o,
      total: o.total_amount_paise != null ? o.total_amount_paise / 100 : 0,
    }))

    const mappedViewed = (viewed || []).map(v => ({
      product_id: v.product_id,
      viewed_at:  v.viewed_at,
      product: v.products ? {
        id:    v.products.id,
        name:  v.products.title,
        price: v.products.price_paise != null ? v.products.price_paise / 100 : 0,
        image: v.products.thumbnail,
      } : null
    })).filter(v => v.product)

    res.json({
      orders:   mappedOrders,
      viewed:   mappedViewed,
      searches: searches || []
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/activity/viewed — track product view
router.post('/viewed', authMiddleware, async (req, res) => {
  const { product_id } = req.body
  if (!product_id) return res.status(400).json({ error: 'product_id required' })
  try {
    await supabase
      .from('recently_viewed')
      .upsert(
        [{ user_id: req.user.id, product_id, viewed_at: new Date().toISOString() }],
        { onConflict: 'user_id,product_id' }
      )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/activity/search — track search query
router.post('/search', authMiddleware, async (req, res) => {
  const { query, condition } = req.body
  if (!query) return res.status(400).json({ error: 'query required' })
  try {
    await supabase
      .from('recent_searches')
      .upsert(
        [{ user_id: req.user.id, query, condition: condition || null, searched_at: new Date().toISOString() }],
        { onConflict: 'user_id,query' }
      )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router