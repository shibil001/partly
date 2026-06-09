// backend/supabase.js
//
// Two clients are available:
//   • supabaseAdmin (default export) — service_role key. Bypasses RLS.
//     Use this for backend routes that act on behalf of an authenticated user
//     after your authMiddleware has verified the JWT.
//   • supabaseAnon — anon key. Honours RLS. Used only by the auth flows
//     (signUp / signInWithPassword) where there is no authenticated user yet.
//
// IMPORTANT: never expose the service_role key to the frontend.
// IMPORTANT: rename SUPABASE_KEY to SUPABASE_SERVICE_ROLE_KEY in your .env.

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY  // fallback for legacy .env
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL) throw new Error('SUPABASE_URL is not set in .env')
if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY (or legacy SUPABASE_KEY) is not set in .env')
}
if (!SUPABASE_ANON_KEY) throw new Error('SUPABASE_ANON_KEY is not set in .env')

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Default export = admin client. Existing code that does
//   const supabase = require('../supabase')
// keeps working with elevated access (which is what every backend route
// already assumed it had).
module.exports = supabaseAdmin
module.exports.supabaseAdmin = supabaseAdmin
module.exports.supabaseAnon = supabaseAnon