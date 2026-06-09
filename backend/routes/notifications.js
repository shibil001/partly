const express = require('express')
const router = express.Router()
const supabase = require('../supabase')
const authMiddleware = require('../middleware/auth')

// Helper — shape notification for frontend
const fmt = (n) => ({
  ...n,
  read:    !!n.read_at,
  message: n.body,   // legacy alias
})

// GET /api/notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(30)
    if (error) throw error
    res.json({ notifications: (data || []).map(fmt) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/notifications/count — unread count for header badge
router.get('/count', authMiddleware, async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .is('read_at', null)
    if (error) throw error
    res.json({ count: count || 0 })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/notifications/:id/read — mark one as read
router.post('/:id/read', authMiddleware, async (req, res) => {
  try {
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .is('read_at', null)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/notifications/read-all — mark all as read
router.post('/read-all', authMiddleware, async (req, res) => {
  try {
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', req.user.id)
      .is('read_at', null)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/notifications/:id — delete one
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router