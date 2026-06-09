const express = require('express')
const router = express.Router()
const supabase = require('../supabase')
const authMiddleware = require('../middleware/auth')

// GET /api/wishlist — load wishlist for logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('wishlists')
      .select('items')
      .eq('user_id', req.user.id)
      .single()

    if (error || !data) return res.json({ items: [] })
    res.json({ items: data.items || [] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/wishlist — save wishlist for logged-in user
router.post('/', authMiddleware, async (req, res) => {
  const { items } = req.body
  try {
    const { data: existing } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', req.user.id)
      .single()

    if (existing) {
      await supabase
        .from('wishlists')
        .update({ items, updated_at: new Date().toISOString() })
        .eq('user_id', req.user.id)
    } else {
      await supabase
        .from('wishlists')
        .insert([{ user_id: req.user.id, items }])
    }

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router