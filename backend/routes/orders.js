const express = require('express')
const router = express.Router()
const supabase = require('../supabase')
const authMiddleware = require('../middleware/auth')

// Helper: convert rupees to paise
const toPaise = (r) => r != null ? Math.round(parseFloat(r) * 100) : 0

// Helper: generate order number
const genOrderNumber = () => {
  const now = new Date()
  const y = now.getFullYear()
  const rand = Math.floor(Math.random() * 900000) + 100000
  return `PRT-${y}-${rand}`
}

// Helper: format order for frontend (convert paise back to rupees)
const fmtOrder = (o) => {
  if (!o) return null
  return {
    ...o,
    total_amount:        o.total_amount_paise        != null ? o.total_amount_paise / 100        : 0,
    subtotal:            o.subtotal_paise             != null ? o.subtotal_paise / 100             : 0,
    shipping_fee:        o.shipping_fee_paise         != null ? o.shipping_fee_paise / 100         : 0,
    tax_amount:          o.tax_amount_paise           != null ? o.tax_amount_paise / 100           : 0,
    discount_amount:     o.discount_amount_paise      != null ? o.discount_amount_paise / 100      : 0,
    commission_amount:   o.commission_amount_paise    != null ? o.commission_amount_paise / 100    : 0,
    seller_payout_amount: o.seller_payout_amount_paise != null ? o.seller_payout_amount_paise / 100 : 0,
  }
}


// =============================================================================
// POST /api/orders — create order(s), one per seller
// =============================================================================
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      items,
      total,
      shipping_address,
      payment_method,
      client_idempotency_key,
    } = req.body

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in order' })
    }

    // Check for suspended sellers
    const sellerIds = [...new Set(items.map(i => i.seller_id).filter(Boolean))]
    if (sellerIds.length > 0) {
      const { data: suspendedShops } = await supabase
        .from('shops')
        .select('id, shop_name')
        .eq('status', 'suspended')
        .in('user_id', sellerIds)
      if (suspendedShops?.length > 0) {
        return res.status(403).json({
          error: 'One or more sellers are currently suspended. Remove their items and try again.'
        })
      }
    }

    // Fetch product info for stock check and seller resolution
    const productIds = [...new Set(items.map(i => i.id))]
    const { data: products } = await supabase
      .from('products')
      .select('id, seller_id, shop_id, title, price_paise, thumbnail, stock, condition')
      .in('id', productIds)

    const productMap = {}
    if (products) products.forEach(p => { productMap[p.id] = p })

    // Group items by seller
    const sellerGroups = {}
    for (const item of items) {
      const sellerId = productMap[item.id]?.seller_id || item.seller_id || 'unknown'
      if (!sellerGroups[sellerId]) sellerGroups[sellerId] = []
      sellerGroups[sellerId].push(item)
    }

    const createdOrders = []

    for (const [sellerId, sellerItems] of Object.entries(sellerGroups)) {
      const subtotalPaise = sellerItems.reduce((sum, i) => {
        const pricePaise = productMap[i.id]?.price_paise ?? toPaise(i.price)
        return sum + (pricePaise * (i.quantity || 1))
      }, 0)

      // Get commission rate from tiers
      let commissionRate = 10.0
      const { data: tier } = await supabase
        .from('commission_tiers')
        .select('rate_percent')
        .lte('min_amount_paise', subtotalPaise)
        .or('max_amount_paise.is.null,max_amount_paise.gt.' + subtotalPaise)
        .is('effective_to', null)
        .order('min_amount_paise', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (tier) commissionRate = tier.rate_percent

      const commissionPaise = Math.round(subtotalPaise * commissionRate / 100)

      const { data: shop } = await supabase
        .from('shops')
        .select('id')
        .eq('user_id', sellerId)
        .maybeSingle()

      const orderPayload = {
        order_number:           genOrderNumber(),
        buyer_id:               req.user.id,
        seller_id:              sellerId === 'unknown' ? null : sellerId,
        shop_id:                shop?.id || null,
        subtotal_paise:         subtotalPaise,
        shipping_fee_paise:     0,
        tax_amount_paise:       0,
        discount_amount_paise:  0,
        total_amount_paise:     subtotalPaise,
        commission_rate:        commissionRate,
        commission_amount_paise: commissionPaise,
        seller_payout_amount_paise: subtotalPaise - commissionPaise,
        shipping_address:       shipping_address || {},
        shipping_pincode:       shipping_address?.pincode || null,
        payment_method:         payment_method || 'cod',
        payment_status:         'pending',
        status:                 'pending',
        // Idempotency key — prevents duplicate orders from double-clicks
        ...(client_idempotency_key ? { client_idempotency_key } : {}),
      }

      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select()
        .single()

      if (orderErr) {
        // Unique violation on idempotency key — return existing order
        if (orderErr.code === '23505' && client_idempotency_key) {
          const { data: existing } = await supabase
            .from('orders')
            .select('*')
            .eq('client_idempotency_key', client_idempotency_key)
            .single()
          if (existing) { createdOrders.push(existing); continue }
        }
        throw orderErr
      }

      // Insert order_items
      const orderItems = sellerItems.map(item => {
        const prod = productMap[item.id]
        const pricePaise = prod?.price_paise ?? toPaise(item.price)
        const qty = item.quantity || 1
        return {
          order_id:         order.id,
          product_id:       item.id,
          title:            prod?.title || item.name || 'Unknown',
          thumbnail:        prod?.thumbnail || item.image || null,
          price_paise:      pricePaise,
          quantity:         qty,
          total_paise:      pricePaise * qty,
          variant:          item.size || null,
          product_snapshot: {
            title:     prod?.title || item.name,
            thumbnail: prod?.thumbnail || item.image,
            price:     pricePaise / 100,
            condition: prod?.condition || item.condition,
            size:      item.size || null,
          },
        }
      })
      await supabase.from('order_items').insert(orderItems)

      createdOrders.push(order)
    }

    // Decrement stock
    for (const item of items) {
      const prod = productMap[item.id]
      if (prod && prod.stock > 0) {
        await supabase
          .from('products')
          .update({ stock: Math.max(0, prod.stock - (item.quantity || 1)) })
          .eq('id', item.id)
      }
    }

    // Clear buyer's cart
    await supabase.from('cart_items').delete().eq('user_id', req.user.id)

    // Notify sellers
    const sellerNotifs = createdOrders
      .filter(o => o.seller_id)
      .map(o => ({
        user_id: o.seller_id,
        type:    'order_received',
        title:   'New Order Received!',
        body:    `You have a new order worth ₹${((o.total_amount_paise || 0) / 100).toFixed(0)}`,
        data:    { order_id: o.id },
      }))
    if (sellerNotifs.length > 0) {
      await supabase.from('notifications').insert(sellerNotifs)
    }

    // Notify buyer
    const grandTotal = createdOrders.reduce((s, o) => s + (o.total_amount_paise || 0), 0)
    await supabase.from('notifications').insert([{
      user_id: req.user.id,
      type:    'order_placed',
      title:   'Order Confirmed!',
      body:    `Your order has been placed. Total: ₹${(grandTotal / 100).toFixed(0)}`,
      data:    { order_ids: createdOrders.map(o => o.id) },
    }])

    res.json({
      order:  fmtOrder(createdOrders[0]),
      orders: createdOrders.map(fmtOrder),
      message: 'Order placed successfully'
    })
  } catch (err) {
    console.error('order create error:', err)
    res.status(500).json({ error: err.message })
  }
})


// =============================================================================
// GET /api/orders — buyer's own orders
// =============================================================================
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id, title, thumbnail, price_paise, quantity, total_paise, product_id, variant
        )
      `)
      .eq('buyer_id', req.user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error

    const orders = (data || []).map(o => ({
      ...fmtOrder(o),
      items: (o.order_items || []).map(i => ({
        id:       i.product_id,
        name:     i.title,
        image:    i.thumbnail,
        price:    i.price_paise != null ? i.price_paise / 100 : 0,
        quantity: i.quantity,
        total:    i.total_paise != null ? i.total_paise / 100 : 0,
        size:     i.variant || null,
      }))
    }))

    res.json({ orders })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// =============================================================================
// GET /api/orders/seller — seller's orders
// =============================================================================
router.get('/seller', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id, title, thumbnail, price_paise, quantity, total_paise, product_id, variant
        )
      `)
      .eq('seller_id', req.user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error

    const orders = (data || []).map(o => ({
      ...fmtOrder(o),
      items: (o.order_items || []).map(i => ({
        id:       i.product_id,
        name:     i.title,
        image:    i.thumbnail,
        price:    i.price_paise != null ? i.price_paise / 100 : 0,
        quantity: i.quantity,
        total:    i.total_paise != null ? i.total_paise / 100 : 0,
        size:     i.variant || null,
      }))
    }))

    res.json({ orders })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// =============================================================================
// POST /api/orders/:id/cancel — buyer cancels order
// =============================================================================
router.post('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const { data: order } = await supabase
      .from('orders')
      .select('id, status, buyer_id')
      .eq('id', req.params.id)
      .single()

    if (!order) return res.status(404).json({ error: 'Order not found' })
    if (order.buyer_id !== req.user.id) return res.status(403).json({ error: 'Not your order' })
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ error: 'Only pending or confirmed orders can be cancelled' })
    }

    await supabase
      .from('orders')
      .update({
        status:       'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: 'buyer',
      })
      .eq('id', req.params.id)

    res.json({ message: 'Order cancelled successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// =============================================================================
// PATCH /api/orders/:id/status — seller updates order status
// =============================================================================
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status, cancellation_reason, cancelled_by, tracking_number, courier, delivery_partner } = req.body
    const resolvedCourier = courier || delivery_partner || null

    const validStatuses = ['pending', 'confirmed', 'processing', 'processed', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    // Accept both 'processed' (frontend) and 'processing' (DB enum name)
    // Always save 'processing' to DB since that's what the enum allows
    const normStatus = (status === 'processed' || status === 'processing') ? 'processing' : status

    const { data: order } = await supabase
      .from('orders')
      .select('seller_id, buyer_id, total_amount_paise')
      .eq('id', req.params.id)
      .single()

    if (!order || order.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not your order' })
    }

    const now = new Date().toISOString()
    const updates = { status: normStatus }

    if (normStatus === 'confirmed')   updates.confirmed_at   = now
    if (normStatus === 'processing') {
      updates.processing_at  = now
      if (tracking_number)   updates.tracking_number = tracking_number
      if (resolvedCourier)   updates.courier         = resolvedCourier
    }
    if (normStatus === 'shipped') {
      updates.shipped_at = now
      if (tracking_number) updates.tracking_number = tracking_number
      if (resolvedCourier) updates.courier          = resolvedCourier
    }
    if (normStatus === 'delivered') {
      updates.delivered_at       = now
      updates.return_window_until = new Date(Date.now() + 7  * 24 * 60 * 60 * 1000).toISOString()
      updates.payout_eligible_at  = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    }
    if (normStatus === 'cancelled') {
      updates.cancellation_reason = cancellation_reason || null
      updates.cancelled_by        = cancelled_by || 'seller'
      updates.cancelled_at        = now
    }

    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', req.params.id)

    if (error) throw error

    // Notify buyer
    if (order.buyer_id) {
      const msgs = {
        confirmed:  'Your order has been confirmed by the seller!',
        processing: 'Seller has packed your order.',
        shipped:    `Your order has been shipped!${tracking_number ? ' Tracking: ' + tracking_number : ''}`,        delivered:  'Your order has been delivered!',
        cancelled:  'Your order has been cancelled by the seller.',
      }
      if (msgs[normStatus]) {
        await supabase.from('notifications').insert([{
          user_id: order.buyer_id,
          type:    'order_status',
          title:   `Order ${normStatus.charAt(0).toUpperCase() + normStatus.slice(1)}`,
          body:    msgs[normStatus],
          data:    { order_id: req.params.id },
        }])
      }
    }

    res.json({ message: 'Order status updated' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router