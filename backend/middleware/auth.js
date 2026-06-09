// backend/middleware/auth.js
//
// Verifies the Supabase access token from the Authorization header and
// attaches the user to req.user.
//
// Drop-in replacement for the previous JWT_SECRET-based middleware.
// Routes don't need to change — req.user.id is still the user UUID,
// req.user.email is still the email. We additionally attach req.user.role
// (resolved from public.users) and req.token for any downstream calls.

const { supabaseAdmin } = require('../supabase')

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    // Verify the token with Supabase Auth. Returns the auth user if valid.
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !authData?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    const authUser = authData.user

    // Look up role + ban status from public.users.
    // We pull a small set of fields to avoid wasting egress on every request.
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, is_banned, deleted_at')
      .eq('id', authUser.id)
      .single()

    if (profileError || !profile) {
      // The auth row exists but the public.users row doesn't — probably
      // the trigger failed at signup. Bail out cleanly.
      return res.status(401).json({ error: 'User profile not found' })
    }

    if (profile.is_banned || profile.deleted_at) {
      return res.status(403).json({ error: 'Account is no longer active' })
    }

    req.user = {
      id: profile.id,
      email: profile.email,
      role: profile.role
    }
    req.token = token
    next()
  } catch (err) {
    res.status(401).json({ error: 'Authentication failed' })
  }
}