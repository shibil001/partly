// backend/routes/admin.js
const express = require('express')
const router = express.Router()
const supabase = require('../supabase')

// ─── USERS ───────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, username, phone, avatar_url, role, is_banned, created_at')
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json({ users: data || [] })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.patch('/users/:id/ban', async (req, res) => {
  const { is_banned } = req.body
  try {
    const { error } = await supabase.from('users').update({ is_banned: !!is_banned }).eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── SHOPS ───────────────────────────────────────────────────────
router.get('/shops', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('shops')
      .select('id, user_id, shop_name, shop_username, status, logo_url, cover_url, description, product_condition, has_physical_store, categories, has_gst, gst_number, rejection_reason, suspension_reason, suspended_at, resubmit_deadline, resubmitted_at, approved_at, created_at')
      .order('created_at', { ascending: false })
    if (error) throw error

    // Get user details separately
    const userIds = [...new Set((data || []).map(s => s.user_id))]
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, email, phone')
      .in('id', userIds)
    const userMap = Object.fromEntries((users || []).map(u => [u.id, u]))

    const shops = (data || []).map(s => ({
      ...s,
      users: userMap[s.user_id] || null
    }))

    res.json({ shops })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.patch('/shops/:id/status', async (req, res) => {
  const { status, rejection_reason, suspension_reason, resubmit_deadline } = req.body
  try {
    const updates = { status }
    if (status === 'active') updates.approved_at = new Date().toISOString()
    if (status === 'rejected') updates.rejection_reason = rejection_reason || null
    if (status === 'suspended') {
      updates.suspension_reason = suspension_reason || 'Violation of Partly terms'
      updates.suspended_at = new Date().toISOString()
      if (resubmit_deadline) updates.resubmit_deadline = resubmit_deadline
    }
    const { error } = await supabase.from('shops').update(updates).eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── PRODUCTS ─────────────────────────────────────────────────────
router.get('/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, title, thumbnail, price_paise, status, condition, stock, brand, category, shop_name, shop_username, flair_tag, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw error
    const products = (data || []).map(p => ({ ...p, price: p.price_paise / 100, featured: p.flair_tag === 'featured' }))
    res.json({ products })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/products/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('products').update({ deleted_at: new Date().toISOString(), status: 'inactive' }).eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.patch('/products/:id/feature', async (req, res) => {
  const { featured } = req.body
  try {
    const { error } = await supabase.from('products').update({ flair_tag: featured ? 'featured' : null }).eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── ORDERS ───────────────────────────────────────────────────────
router.get('/orders', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id, buyer_id, seller_id, status, total_amount_paise, tracking_number, courier, created_at, confirmed_at, shipped_at, delivered_at, order_items (id, product_id, quantity, price_paise, variant)')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw error

    // Get buyer names
    const buyerIds = [...new Set((data || []).map(o => o.buyer_id))]
    const { data: buyers } = await supabase.from('users').select('id, full_name, email').in('id', buyerIds)
    const buyerMap = Object.fromEntries((buyers || []).map(b => [b.id, b]))

    const orders = (data || []).map(o => ({
      ...o,
      total_amount: o.total_amount_paise / 100,
      buyer_name: buyerMap[o.buyer_id]?.full_name || 'Unknown',
      buyer_email: buyerMap[o.buyer_id]?.email || ''
    }))
    res.json({ orders })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.patch('/orders/:id/status', async (req, res) => {
  const { status } = req.body
  try {
    const { error } = await supabase.from('orders').update({ status }).eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── MESSAGES ─────────────────────────────────────────────────────
router.get('/messages', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('id, sender_id, recipient_id, content, type, status, read_at, created_at')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw error

    const userIds = [...new Set([...(data || []).map(m => m.sender_id), ...(data || []).map(m => m.recipient_id)])]
    const { data: users } = await supabase.from('users').select('id, full_name, role').in('id', userIds)
    const userMap = Object.fromEntries((users || []).map(u => [u.id, u]))

    const convMap = {}
    ;(data || []).forEach(m => {
      const key = [m.sender_id, m.recipient_id].sort().join('|')
      if (!convMap[key]) {
        const sender = userMap[m.sender_id] || {}
        const recipient = userMap[m.recipient_id] || {}
        convMap[key] = {
          id: key,
          user_name: sender.role === 'buyer' ? sender.full_name : recipient.full_name,
          seller_name: sender.role === 'seller' ? sender.full_name : recipient.full_name,
          subject: 'Messages', status: 'open', messages: [], created_at: m.created_at
        }
      }
      let text = m.content
      try {
        const parsed = JSON.parse(m.content)
        text = parsed.text || parsed.content || (parsed.offer_amount ? `Offer: ₹${parsed.offer_amount}` : m.content)
      } catch {}
      convMap[key].messages.push({ id: m.id, sender: userMap[m.sender_id]?.role === 'buyer' ? 'user' : 'seller', text: String(text), created_at: m.created_at })
    })

    const conversations = Object.values(convMap).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    res.json({ conversations })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/admin/messages/reply — admin replies to a support message
router.post('/messages/reply', async (req, res) => {
  const { recipient_id, content } = req.body
  const SUPPORT_USER_ID = process.env.SUPPORT_USER_ID
  if (!SUPPORT_USER_ID) return res.status(503).json({ error: 'Support not configured' })
  if (!recipient_id || !content?.trim()) return res.status(400).json({ error: 'recipient_id and content required' })
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        sender_id:    SUPPORT_USER_ID,
        recipient_id: recipient_id,
        content:      content.trim(),
      }])
      .select()
      .single()
    if (error) throw error
    res.json({ message: data })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.patch('/messages/:id/status', async (req, res) => {
  res.json({ success: true }) // conversation status — handled client-side for now
})

// ─── DISPUTES ──────────────────────────────────────────────────────
router.get('/disputes', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('disputes')
      .select('id, order_id, buyer_id, seller_id, status, reason, buyer_evidence, seller_response, admin_decision, created_at, resolved_at')
      .order('created_at', { ascending: false })
    if (error) throw error

    const userIds = [...new Set([...(data || []).map(d => d.buyer_id), ...(data || []).map(d => d.seller_id)])]
    const { data: users } = await supabase.from('users').select('id, full_name, email').in('id', userIds)
    const userMap = Object.fromEntries((users || []).map(u => [u.id, u]))

    const disputes = (data || []).map(d => ({
      ...d,
      buyer_name: userMap[d.buyer_id]?.full_name || 'Unknown',
      seller_name: userMap[d.seller_id]?.full_name || 'Unknown'
    }))
    res.json({ disputes })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.patch('/disputes/:id', async (req, res) => {
  const { status, admin_decision } = req.body
  try {
    const { error } = await supabase.from('disputes').update({ status, admin_decision, resolved_at: new Date().toISOString() }).eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── RETURNS ───────────────────────────────────────────────────────
router.get('/returns', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('returns')
      .select('id, order_id, buyer_id, seller_id, status, reason, description, created_at, resolved_at')
      .order('created_at', { ascending: false })
    if (error) throw error

    const userIds = [...new Set([...(data || []).map(r => r.buyer_id), ...(data || []).map(r => r.seller_id)])]
    const { data: users } = await supabase.from('users').select('id, full_name').in('id', userIds)
    const userMap = Object.fromEntries((users || []).map(u => [u.id, u]))

    const returns = (data || []).map(r => ({ ...r, buyer_name: userMap[r.buyer_id]?.full_name || 'Unknown', seller_name: userMap[r.seller_id]?.full_name || 'Unknown' }))
    res.json({ returns })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.patch('/returns/:id', async (req, res) => {
  const { status } = req.body
  try {
    const { error } = await supabase.from('returns').update({ status, resolved_at: new Date().toISOString() }).eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── PAYOUTS ───────────────────────────────────────────────────────
router.get('/payouts', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payouts')
      .select('id, seller_id, amount_paise, status, payout_date, reference_id, created_at')
      .order('created_at', { ascending: false })
    if (error) throw error

    const sellerIds = [...new Set((data || []).map(p => p.seller_id))]
    const { data: sellers } = await supabase.from('users').select('id, full_name').in('id', sellerIds)
    const sellerMap = Object.fromEntries((sellers || []).map(s => [s.id, s]))

    const payouts = (data || []).map(p => ({ ...p, amount: p.amount_paise / 100, seller_name: sellerMap[p.seller_id]?.full_name || 'Unknown' }))
    res.json({ payouts })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── BANNERS ───────────────────────────────────────────────────────
router.get('/banners', async (req, res) => {
  try {
    const { data, error } = await supabase.from('banners').select('id, title, link, image, active, created_at').order('created_at', { ascending: false })
    if (error) throw error
    res.json({ banners: data || [] })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/banners', async (req, res) => {
  const { title, link, image, active } = req.body
  try {
    const { data, error } = await supabase.from('banners').insert([{ title, link, image, active: active !== false }]).select().single()
    if (error) throw error
    res.json({ banner: data })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.patch('/banners/:id', async (req, res) => {
  const { active, title, link, image } = req.body
  try {
    const updates = {}
    if (active !== undefined) updates.active = active
    if (title !== undefined) updates.title = title
    if (link !== undefined) updates.link = link
    if (image !== undefined) updates.image = image
    const { error } = await supabase.from('banners').update(updates).eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/banners/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('banners').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── ACTIVITY LOG ──────────────────────────────────────────────────
router.get('/activity', async (req, res) => {
  try {
    const { data, error } = await supabase.from('activity_log').select('id, action, target, target_id, details, timestamp').order('timestamp', { ascending: false }).limit(100)
    if (error) throw error
    res.json({ logs: data || [] })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/activity', async (req, res) => {
  const { action, target, target_id, details } = req.body
  try {
    const { error } = await supabase.from('activity_log').insert([{ action, target, target_id, details, timestamp: new Date().toISOString() }])
    if (error) throw error
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── BULK NOTIFICATIONS ────────────────────────────────────────────
router.post('/notifications/bulk', async (req, res) => {
  const { title, body, target } = req.body
  try {
    let query = supabase.from('users').select('id, role').is('deleted_at', null).eq('is_banned', false)
    if (target === 'buyers') query = query.eq('role', 'buyer')
    else if (target === 'sellers') query = query.eq('role', 'seller')
    const { data: users } = await query
    if (!users || users.length === 0) return res.json({ count: 0 })
    const notifications = users.map(u => ({ user_id: u.id, type: 'admin', title, body }))
    for (let i = 0; i < notifications.length; i += 100) {
      await supabase.from('notifications').insert(notifications.slice(i, i + 100))
    }
    res.json({ count: notifications.length })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router