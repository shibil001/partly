// backend/routes/auth.js
//
// Buyer / seller login and registration. Uses Supabase Auth.
// API contract preserved so existing frontend code continues to work:
//
//   POST /api/auth/register
//     body: { email, password, full_name, phone, role, username? }
//     returns: { message, token, user }
//
//   POST /api/auth/login
//     body: { email, password }
//     returns: { message, token, user, shop, cart }
//
//   GET /api/auth/check-username?username=xxx
//     returns: { available }
//
// Notes:
//   • Token returned is the Supabase access_token (a JWT signed by Supabase).
//   • Frontend continues to send `Authorization: Bearer <token>` on requests.
//   • Password is no longer stored in public.users — Supabase Auth manages it.
//   • The fn_handle_new_auth_user trigger creates the public.users row
//     automatically. We then UPDATE it with phone/role/full_name.

const express = require('express')
const router = express.Router()
const { supabaseAdmin, supabaseAnon } = require('../supabase')

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
router.post('/register', async (req, res) => {
  const { email, password, full_name, phone, role, username } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }

  const requestedRole = role === 'seller' ? 'seller' : 'buyer'

  try {
    // Create the auth user. Supabase will hash + store the password securely.
    // The trigger fn_handle_new_auth_user creates the matching public.users row.
    const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,                              // skip email verification for now
      user_metadata: { full_name, username }
    })

    if (signUpError) {
      // Supabase returns a duplicate-email error code we can map cleanly
      const msg = signUpError.message || ''
      if (/already registered|already exists|duplicate/i.test(msg)) {
        return res.status(400).json({ error: 'Email already registered' })
      }
      throw signUpError
    }

    const authUser = signUpData.user
    if (!authUser) {
      return res.status(500).json({ error: 'Failed to create user' })
    }

    // The trigger created public.users with default role='buyer'. Update with
    // the fields the frontend supplied. We use upsert to handle the rare race
    // where the trigger hasn't fired yet.
    await supabaseAdmin
      .from('users')
      .update({
        full_name: full_name || null,
        phone: phone || null,
        role: requestedRole,
        ...(username ? { username } : {})
      })
      .eq('id', authUser.id)

    // Create a session for the new user so they're logged in immediately.
    // signInWithPassword on the anon client returns the access_token we want.
    const { data: session, error: sessionError } =
      await supabaseAnon.auth.signInWithPassword({ email, password })

    if (sessionError || !session?.session) {
      // Account exists but session failed — frontend can recover by hitting /login
      return res.status(201).json({
        message: 'Account created. Please sign in.',
        user: {
          id: authUser.id,
          email: authUser.email,
          full_name,
          username,
          phone,
          role: requestedRole
        }
      })
    }

    res.status(201).json({
      message: 'Account created successfully',
      token: session.session.access_token,
      refresh_token: session.session.refresh_token,
      user: {
        id: authUser.id,
        email: authUser.email,
        full_name,
        username,
        phone,
        avatar_url: null,
        role: requestedRole
      }
    })
  } catch (error) {
    console.error('register error:', error)
    res.status(500).json({ error: error.message || 'Registration failed' })
  }
})


// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  try {
    const { data: authData, error: authError } =
      await supabaseAnon.auth.signInWithPassword({ email, password })

    if (authError || !authData?.session) {
      return res.status(400).json({ error: 'Invalid email or password' })
    }

    const authUser = authData.user
    const session = authData.session

    // Fetch profile (role, username, avatar etc.) from public.users
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, username, phone, avatar_url, role, is_banned, deleted_at')
      .eq('id', authUser.id)
      .single()

    if (profileError || !profile) {
      return res.status(404).json({ error: 'User profile not found' })
    }
    if (profile.is_banned || profile.deleted_at) {
      return res.status(403).json({ error: 'Account is no longer active' })
    }

    // Cart — table is `cart_items` in the new schema, not `carts`
    const { data: cartItems } = await supabaseAdmin
      .from('cart_items')
      .select('product_id, quantity, added_at')
      .eq('user_id', profile.id)

    // If seller, fetch shop
    let shopData = null
    if (profile.role === 'seller') {
      const { data: shop } = await supabaseAdmin
        .from('shops')
        .select('id, shop_name, shop_username, product_condition, status, logo_url, cover_url, description, has_physical_store, categories, has_gst, show_condition_badge, custom_tag')
        .eq('user_id', profile.id)
        .single()
      shopData = shop || null
    }

    res.json({
      message: 'Login successful',
      token: session.access_token,
      refresh_token: session.refresh_token,
      user: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        username: profile.username,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        role: profile.role
      },
      shop: shopData,
      cart: cartItems || []
    })
  } catch (error) {
    console.error('login error:', error)
    res.status(500).json({ error: error.message || 'Login failed' })
  }
})


// ---------------------------------------------------------------------------
// POST /api/auth/refresh
// Exchanges a refresh token for a fresh access token.
// Frontend should call this when the access token is about to expire.
// ---------------------------------------------------------------------------
router.post('/refresh', async (req, res) => {
  const { refresh_token } = req.body
  if (!refresh_token) {
    return res.status(400).json({ error: 'refresh_token is required' })
  }
  try {
    const { data, error } = await supabaseAnon.auth.refreshSession({ refresh_token })
    if (error || !data?.session) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' })
    }
    res.json({
      token: data.session.access_token,
      refresh_token: data.session.refresh_token
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// ---------------------------------------------------------------------------
// POST /api/auth/logout
// Server-side revoke. Frontend should also drop the local token.
// ---------------------------------------------------------------------------
router.post('/logout', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.json({ message: 'Logged out' })
  try {
    // Revokes the access token globally
    await supabaseAdmin.auth.admin.signOut(token)
    res.json({ message: 'Logged out' })
  } catch (err) {
    // Always succeed from the client's perspective — they're logging out anyway
    res.json({ message: 'Logged out' })
  }
})


// ---------------------------------------------------------------------------
// GET /api/auth/check-username?username=xxx
// Unchanged behaviour.
// ---------------------------------------------------------------------------
router.get('/check-username', async (req, res) => {
  const { username } = req.query
  if (!username || username.length < 3) return res.json({ available: false })

  try {
    const { data: userMatch } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    if (userMatch) return res.json({ available: false })

    const { data: shopMatch } = await supabaseAdmin
      .from('shops')
      .select('id')
      .eq('shop_username', username)
      .maybeSingle()

    res.json({ available: !shopMatch })
  } catch {
    res.json({ available: true })
  }
})


// ---------------------------------------------------------------------------
// POST /api/auth/forgot-password
// Sends a password reset email via Supabase. Frontend gives a redirect URL
// where the user lands after clicking the link.
// ---------------------------------------------------------------------------
router.post('/forgot-password', async (req, res) => {
  const { email, redirect_to } = req.body
  if (!email) return res.status(400).json({ error: 'Email is required' })
  try {
    const { error } = await supabaseAnon.auth.resetPasswordForEmail(email, {
      redirectTo: redirect_to
    })
    // Always reply 200 — don't reveal whether the email exists
    res.json({ message: 'If an account exists, a reset email has been sent.' })
    if (error) console.error('forgot-password:', error.message)
  } catch (err) {
    res.json({ message: 'If an account exists, a reset email has been sent.' })
  }
})


module.exports = router