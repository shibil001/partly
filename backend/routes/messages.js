const express = require('express')
const router = express.Router()
const supabase = require('../supabase')
const authMiddleware = require('../middleware/auth')

// Helper: parse message content — offers and product-context messages are stored as JSON
function parseMsg(msg) {
  if (!msg) return msg
  let parsed = null
  try { parsed = JSON.parse(msg.content) } catch {}
  const isOffer = parsed && parsed.type === 'offer'
  const isMsgWithProduct = parsed && parsed.type === 'message' && parsed.product_id
  return {
    ...msg,
    // Reconstruct old-schema fields the frontend expects
    receiver_id:   msg.recipient_id,
    type:          isOffer ? 'offer' : 'message',
    offer_amount:  isOffer ? parsed.offer_amount : null,
    note:          isOffer ? parsed.note : null,
    product_id:    parsed?.product_id || null,
    product_name:  parsed?.product_name || null,
    product_price: parsed?.product_price || null,
    product_image: parsed?.product_image || null,
    read:          !!msg.read_at,
    status:        msg.status || null,
    // Keep content as the display string
    content: isOffer
      ? `Offer: ₹${parsed.offer_amount}${parsed.note ? ` — ${parsed.note}` : ''}`
      : isMsgWithProduct
        ? parsed.text
        : (msg.content || ''),
  }
}


// =============================================================================
// GET /api/messages — all messages for current user
// =============================================================================
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${req.user.id},recipient_id.eq.${req.user.id}`)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    res.json({ messages: (data || []).map(parseMsg) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// =============================================================================
// GET /api/messages/seller — offers + messages received by seller
// =============================================================================
router.get('/seller', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('recipient_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    const messages = (data || []).map(parseMsg)

    // Fetch buyer info
    const senderIds = [...new Set(messages.map(m => m.sender_id).filter(Boolean))]
    let buyerMap = {}
    if (senderIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, username, avatar_url')
        .in('id', senderIds)
      if (users) users.forEach(u => { buyerMap[u.id] = u })
    }

    // Fetch product thumbnails for offers
    const productIds = [...new Set(messages.map(m => m.product_id).filter(Boolean))]
    let productMap = {}
    if (productIds.length > 0) {
      const { data: prods } = await supabase
        .from('products')
        .select('id, thumbnail')
        .in('id', productIds)
      if (prods) prods.forEach(p => { productMap[p.id] = p.thumbnail })
    }

    // Group offers by buyer+product — keep latest, count rest
    const offerGroups = {}
    const result = []

    for (const msg of messages) {
      msg.buyer = buyerMap[msg.sender_id] || null
      msg.product_image = msg.product_image || productMap[msg.product_id] || null

      if (msg.type === 'offer') {
        const key = `${msg.sender_id}_${msg.product_id || 'none'}`
        if (!offerGroups[key]) {
          offerGroups[key] = { ...msg, offer_count: 1 }
          result.push(offerGroups[key])
        } else {
          offerGroups[key].offer_count++
        }
      } else {
        result.push(msg)
      }
    }

    res.json({ messages: result })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// =============================================================================
// GET /api/messages/count — unread count
// =============================================================================
router.get('/count', authMiddleware, async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', req.user.id)
      .is('read_at', null)

    if (error) throw error
    res.json({ count: count || 0 })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// =============================================================================
// GET /api/messages/buyer — conversations grouped by seller for buyer inbox
// =============================================================================
router.get('/buyer', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${req.user.id},recipient_id.eq.${req.user.id}`)
      .order('created_at', { ascending: false })

    if (error) throw error
    const messages = (data || []).map(parseMsg)

    const sellerIds = [...new Set(messages.map(m =>
      m.sender_id === req.user.id ? m.recipient_id : m.sender_id
    ).filter(Boolean))]

    let shopMap = {}, userMap = {}
    if (sellerIds.length > 0) {
      const { data: shops } = await supabase
        .from('shops')
        .select('user_id, shop_name, logo_url, shop_username')
        .in('user_id', sellerIds)
      if (shops) shops.forEach(s => { shopMap[s.user_id] = s })

      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, username, avatar_url')
        .in('id', sellerIds)
      if (users) users.forEach(u => { userMap[u.id] = u })
    }

    const convos = {}
    for (const msg of messages) {
      const otherId = msg.sender_id === req.user.id ? msg.recipient_id : msg.sender_id
      const isUnread = !msg.read && msg.recipient_id === req.user.id
      if (!convos[otherId]) {
        convos[otherId] = {
          ...msg,
          seller_id: otherId,
          shop: shopMap[otherId] || (userMap[otherId] ? {
            shop_name:     userMap[otherId].full_name || userMap[otherId].username,
            shop_username: userMap[otherId].username,
            logo_url:      userMap[otherId].avatar_url,
          } : null),
          unread: isUnread ? 1 : 0,
        }
      } else if (isUnread) {
        convos[otherId].unread++
      }
    }

    res.json({ conversations: Object.values(convos) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// =============================================================================
// GET /api/messages/conversation/:userId — full thread with one user
// =============================================================================
router.get('/conversation/:userId', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${req.user.id},recipient_id.eq.${req.params.userId}),` +
        `and(sender_id.eq.${req.params.userId},recipient_id.eq.${req.user.id})`
      )
      .order('created_at', { ascending: true })

    if (error) throw error

    // Mark received messages as read
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_id', req.user.id)
      .eq('sender_id', req.params.userId)
      .is('read_at', null)

    res.json({ messages: (data || []).map(parseMsg) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// =============================================================================
// GET /api/messages/my-offer/:productId — check if buyer already made an offer
// =============================================================================
router.get('/my-offer/:productId', authMiddleware, async (req, res) => {
  try {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('sender_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (!data) return res.json({ offer: null })

    const offerMsg = data.find(m => {
      try {
        const p = JSON.parse(m.content)
        return p.type === 'offer' && p.product_id === req.params.productId
      } catch { return false }
    })

    if (!offerMsg) return res.json({ offer: null })

    const parsed = JSON.parse(offerMsg.content)
    res.json({
      offer: {
        ...offerMsg,
        type:         'offer',
        offer_amount: parsed.offer_amount,
        note:         parsed.note,
        product_id:   parsed.product_id,
        product_name: parsed.product_name,
        status:       offerMsg.status || null,
      }
    })
  } catch {
    res.json({ offer: null })
  }
})


// =============================================================================
// GET /api/messages/seller/history/:senderId/:productId — offer history
// =============================================================================
router.get('/seller/history/:senderId/:productId', authMiddleware, async (req, res) => {
  try {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('recipient_id', req.user.id)
      .eq('sender_id', req.params.senderId)
      .order('created_at', { ascending: false })

    if (!data) return res.json({ offers: [] })

    // Filter to offers for this product
    const offers = data
      .map(parseMsg)
      .filter(m => m.type === 'offer' && m.product_id === req.params.productId)

    res.json({ offers })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// =============================================================================
// POST /api/messages — send a message or offer
// =============================================================================
router.post('/', authMiddleware, async (req, res) => {
  const {
    receiver_id, seller_id,
    content, type,
    offer_amount, note,
    product_id, product_name, product_price, product_image,
  } = req.body

  const recipientId = receiver_id || seller_id
  if (!recipientId) return res.status(400).json({ error: 'receiver_id or seller_id is required' })

  try {
    // Find or create conversation
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('buyer_id', req.user.id)
      .eq('seller_id', recipientId)
      .maybeSingle()

    let conversationId = existingConv?.id
    if (!conversationId) {
      const { data: newConv, error: convErr } = await supabase
        .from('conversations')
        .insert([{
          buyer_id:   req.user.id,
          seller_id:  recipientId,
          product_id: product_id || null,
        }])
        .select('id')
        .single()
      if (convErr) throw convErr
      conversationId = newConv.id
    }

    // Store message content — include product context for both offers and messages
    const hasProductContext = product_id || product_name
    const msgContent = type === 'offer'
      ? JSON.stringify({
          type:          'offer',
          offer_amount:  offer_amount,
          note:          note || null,
          product_id:    product_id || null,
          product_name:  product_name || null,
          product_price: product_price || null,
          product_image: product_image || null,
        })
      : hasProductContext
        ? JSON.stringify({
            type:          'message',
            text:          content || '',
            product_id:    product_id || null,
            product_name:  product_name || null,
            product_price: product_price || null,
            product_image: product_image || null,
          })
        : (content || '')

    const { data, error } = await supabase
      .from('messages')
      .insert([{
        conversation_id: conversationId,
        sender_id:       req.user.id,
        recipient_id:    recipientId,
        content:         msgContent,
        attachments:     [],
      }])
      .select()
      .single()

    if (error) throw error

    // Only notify for offers, not plain messages
    if (type === 'offer') {
      await supabase.from('notifications').insert([{
        user_id: recipientId,
        type:    'offer_received',
        title:   'New Offer Received',
        body:    `Offer of ₹${offer_amount}${product_name ? ' for ' + product_name : ''}`,
        data: { sender_id: req.user.id, product_id: product_id || null },
      }])
    }

    res.status(201).json({ message: parseMsg(data) })
  } catch (err) {
    console.error('message insert error:', err.message)
    res.status(500).json({ error: err.message })
  }
})


// =============================================================================
// POST /api/messages/:id/read — mark as read
// =============================================================================
router.post('/:id/read', authMiddleware, async (req, res) => {
  try {
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('recipient_id', req.user.id)

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// =============================================================================
// PATCH /api/messages/:id/status — seller accepts/declines offer
// =============================================================================
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body

    const { data: msg } = await supabase
      .from('messages')
      .select('sender_id, content')
      .eq('id', req.params.id)
      .eq('recipient_id', req.user.id)
      .maybeSingle()

    // Store status (accepted/declined) and mark as read
    const { error: updateError } = await supabase
      .from('messages')
      .update({ status, read_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('recipient_id', req.user.id)

    if (updateError) throw updateError

    // If accepted — mark product and reduce stock by 1
    if (status === 'accepted') {
      try {
        const { data: offerMsg } = await supabase
          .from('messages')
          .select('content')
          .eq('id', req.params.id)
          .maybeSingle()
        if (offerMsg?.content) {
          const parsed = JSON.parse(offerMsg.content)
          if (parsed.product_id) {
            // Get current stock
            const { data: prod } = await supabase
              .from('products')
              .select('stock')
              .eq('id', parsed.product_id)
              .single()
            const newStock = Math.max(0, (prod?.stock || 0) - 1)
            await supabase
              .from('products')
              .update({
                has_accepted_offer: newStock <= 0 ? true : true,
                stock: newStock
              })
              .eq('id', parsed.product_id)
          }
        }
      } catch (e) { console.error('has_accepted_offer update error:', e.message) }
    }
    if (status === 'declined') {
      try {
        const { data: offerMsg } = await supabase
          .from('messages')
          .select('content')
          .eq('id', req.params.id)
          .maybeSingle()
        if (offerMsg?.content) {
          const parsed = JSON.parse(offerMsg.content)
          if (parsed.product_id) {
            // Check if any other accepted offers remain
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'accepted')
            // Restore stock by 1 since this offer was previously accepted
            const { data: prod } = await supabase
              .from('products')
              .select('stock')
              .eq('id', parsed.product_id)
              .single()
            await supabase
              .from('products')
              .update({
                has_accepted_offer: (count || 0) > 0,
                stock: (prod?.stock || 0) + 1
              })
              .eq('id', parsed.product_id)
          }
        }
      } catch (e) { console.error('has_accepted_offer clear error:', e.message) }
    }

    // Notify buyer
    if (msg?.sender_id) {
      let offerAmount = null
      let productName = null
      try {
        const parsed = JSON.parse(msg.content)
        offerAmount = parsed.offer_amount
        productName = parsed.product_name
      } catch {}

      const isAccepted = status === 'accepted'
      await supabase.from('notifications').insert([{
        user_id: msg.sender_id,
        type:    isAccepted ? 'offer_accepted' : 'offer_declined',
        title:   isAccepted ? 'Offer Accepted! 🎉' : 'Offer Declined',
        body:    isAccepted
          ? `Your offer${offerAmount ? ' of ₹' + offerAmount : ''}${productName ? ' for ' + productName : ''} was accepted!`
          : `Your offer was declined by the seller.`,
        data: { message_id: req.params.id },
      }])
    }

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── SUPPORT CHAT ─────────────────────────────────────────────────────────────
// Seller <-> Partly admin support messages
// Uses a fixed admin user ID from env (SUPPORT_USER_ID)

const SUPPORT_USER_ID = process.env.SUPPORT_USER_ID || null

// GET /api/messages/support — get conversation between seller and support
router.get('/support', authMiddleware, async (req, res) => {
  if (!SUPPORT_USER_ID) return res.json({ messages: [] })
  try {
    // Fetch both directions separately and merge
    const [sent, received] = await Promise.all([
      supabase.from('messages').select('id, sender_id, recipient_id, content, created_at')
        .eq('sender_id', req.user.id).eq('recipient_id', SUPPORT_USER_ID),
      supabase.from('messages').select('id, sender_id, recipient_id, content, created_at')
        .eq('sender_id', SUPPORT_USER_ID).eq('recipient_id', req.user.id),
    ])

    const all = [...(sent.data || []), ...(received.data || [])]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    const messages = all.map(m => {
      let content = m.content
      try {
        const parsed = JSON.parse(m.content)
        content = parsed.text || parsed.content || m.content
      } catch {}
      return { ...m, content: typeof content === 'string' ? content : m.content }
    })

    res.json({ messages })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/messages/support — send a support message
router.post('/support', authMiddleware, async (req, res) => {
  if (!SUPPORT_USER_ID) return res.status(503).json({ error: 'Support not configured' })
  const { content } = req.body
  if (!content?.trim()) return res.status(400).json({ error: 'Message is required' })
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        sender_id:    req.user.id,
        recipient_id: SUPPORT_USER_ID,
        content:      content.trim(),
      }])
      .select()
      .single()
    if (error) throw error
    res.json({ message: data })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router