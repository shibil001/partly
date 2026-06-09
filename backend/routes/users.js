// backend/routes/users.js
//
// Complete file — drop-in replacement.
// Original /me and /profile routes preserved unchanged.
// /change-password and /delete-account upgraded to use Supabase Auth.

const express = require('express')
const router = express.Router()
const { supabaseAdmin, supabaseAnon } = require('../supabase')
const authMiddleware = require('../middleware/auth')

// Backwards-compat alias for the original routes below
const supabase = supabaseAdmin


// =============================================================================
// GET /api/users/me — get current user profile (unchanged)
// =============================================================================
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, username, phone, avatar_url, role')
      .eq('id', req.user.id)
      .single()
    if (error) throw error
    res.json({ user: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// =============================================================================
// PATCH /api/users/profile — update profile info or avatar (unchanged)
// =============================================================================
router.patch('/profile', authMiddleware, async (req, res) => {
  const { full_name, username, phone, avatar_url } = req.body

  try {
    if (username) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .neq('id', req.user.id)
        .maybeSingle()

      if (existing) return res.status(400).json({ error: 'Username already taken' })
    }

    const updates = {}
    if (full_name !== undefined) updates.full_name = full_name
    if (username !== undefined) updates.username = username
    if (phone !== undefined) updates.phone = phone
    if (avatar_url !== undefined) updates.avatar_url = avatar_url

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, email, full_name, username, phone, avatar_url, role')
      .single()

    if (error) throw error

    res.json({ message: 'Profile updated', user: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// =============================================================================
// POST /api/users/change-password — uses Supabase Auth (replaces bcrypt)
// =============================================================================
router.post('/change-password', authMiddleware, async (req, res) => {
  const { old_password, new_password } = req.body

  if (!old_password || !new_password) {
    return res.status(400).json({ error: 'Both old and new passwords are required' })
  }
  if (new_password.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' })
  }

  try {
    // Verify the old password by attempting a sign-in
    const { error: verifyError } = await supabaseAnon.auth.signInWithPassword({
      email: req.user.email,
      password: old_password
    })
    if (verifyError) {
      return res.status(400).json({ error: 'Current password is incorrect' })
    }

    // Update password via the admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      req.user.id,
      { password: new_password }
    )
    if (updateError) throw updateError

    res.json({ message: 'Password updated successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// =============================================================================
// DELETE /api/users/delete-account — soft-delete + ban auth user
// =============================================================================
router.delete('/delete-account', authMiddleware, async (req, res) => {
  const { password } = req.body
  if (!password) {
    return res.status(400).json({ error: 'Password is required to confirm deletion' })
  }

  try {
    // Refuse for sellers — keep the rule from the original code
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single()
    if (profile?.role === 'seller') {
      return res.status(403).json({ error: 'Seller accounts cannot be deleted from here' })
    }

    // Verify password
    const { error: verifyError } = await supabaseAnon.auth.signInWithPassword({
      email: req.user.email,
      password
    })
    if (verifyError) {
      return res.status(400).json({ error: 'Incorrect password' })
    }

    // Soft-delete public.users (preserves audit + foreign key references)
    await supabaseAdmin
      .from('users')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', req.user.id)

    // Permanently ban the auth user — prevents any future login
    // (Hard-deleting auth.users would cascade-delete public.users due to FK.)
    await supabaseAdmin.auth.admin.updateUserById(req.user.id, {
      ban_duration: '876000h'   // ~100 years
    })

    res.json({ message: 'Account deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


module.exports = router