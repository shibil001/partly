const express = require('express')
const router = express.Router()
const supabase = require('../supabase')
const authMiddleware = require('../middleware/auth')

// GET /api/cart — load cart items for logged-in user
// Returns items in the shape the frontend expects: [{id, name, price, quantity, image, size}]
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data: cartItems, error } = await supabase
      .from('cart_items')
      .select(`
        product_id,
        quantity,
        added_at,
        products (
          id, title, price_paise, thumbnail, stock, condition,
          shop_name, shop_username
        )
      `)
      .eq('user_id', req.user.id)

    if (error) throw error

    const items = (cartItems || []).map(ci => {
      const p = ci.products
      if (!p) return null
      return {
        id:       p.id,
        name:     p.title,
        price:    p.price_paise != null ? p.price_paise / 100 : 0,
        quantity: ci.quantity,
        image:    p.thumbnail || '',
        size:     null,
        stock:    p.stock,
        condition: p.condition,
        shop_name: p.shop_name,
        added_at: ci.added_at,
      }
    }).filter(Boolean)

    res.json({ items })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// POST /api/cart — sync full cart from frontend (replaces all cart_items for this user)
router.post('/', authMiddleware, async (req, res) => {
  const { items } = req.body
  try {
    // Delete existing cart items for this user
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', req.user.id)

    if (items && items.length > 0) {
      // Re-insert all items. Dedupe by product_id — keep last quantity.
      const seen = new Map()
      for (const item of items) {
        if (item.id) seen.set(item.id, item)
      }
      const rows = Array.from(seen.values()).map(item => ({
        user_id:    req.user.id,
        product_id: item.id,
        quantity:   Math.max(1, parseInt(item.quantity) || 1),
      }))

      if (rows.length > 0) {
        const { error } = await supabase
          .from('cart_items')
          .insert(rows)
        if (error) throw error
      }
    }

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// DELETE /api/cart — clear cart (on logout or after order placed)
router.delete('/', authMiddleware, async (req, res) => {
  try {
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', req.user.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// POST /api/cart/add — add single item to cart
router.post('/add', authMiddleware, async (req, res) => {
  const { product_id, quantity = 1 } = req.body
  if (!product_id) return res.status(400).json({ error: 'product_id required' })
  try {
    // Upsert — if already in cart, update quantity
    const { data: existing } = await supabase
      .from('cart_items')
      .select('quantity')
      .eq('user_id', req.user.id)
      .eq('product_id', product_id)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + parseInt(quantity) })
        .eq('user_id', req.user.id)
        .eq('product_id', product_id)
    } else {
      await supabase
        .from('cart_items')
        .insert([{ user_id: req.user.id, product_id, quantity: parseInt(quantity) }])
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// DELETE /api/cart/:productId — remove single item from cart
router.delete('/:productId', authMiddleware, async (req, res) => {
  try {
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', req.user.id)
      .eq('product_id', req.params.productId)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router