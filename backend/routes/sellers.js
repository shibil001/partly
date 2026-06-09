// backend/routes/sellers.js
const express = require('express')
const router = express.Router()
const { supabaseAdmin, supabaseAnon } = require('../supabase')
const authMiddleware = require('../middleware/auth')
const supabase = supabaseAdmin

router.post('/register', async (req, res) => {
  const {
    firstName, lastName, email, phone,
    idDocumentType, idDocumentNumber, idDocumentPreview,
    shopUsername, shopName, shopEmail, shopPhone,
    shopPassword, hasPhysicalStore, selectedCategories,
    otherCategory, productCondition,
    hasGst, gstNumber, taxIndependent,
    payToName, ifscCode, accountNumber, accountType,
    bankFirstName, bankLastName, bankAddress, bankCity,
    bankPostalCode, bankCountry, bankPhone,
    dobDay, dobMonth, dobYear,
  } = req.body
  if (!shopEmail || !shopPassword) return res.status(400).json({ error: 'Shop email and password are required' })
  if (shopPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })
  let createdAuthUserId = null
  try {
    const { data: existingShop } = await supabaseAdmin.from('shops').select('id').eq('shop_username', shopUsername).maybeSingle()
    if (existingShop) return res.status(400).json({ error: 'Shop username is already taken' })
    const { data: existingUser } = await supabaseAdmin.from('users').select('id').eq('email', shopEmail).maybeSingle()
    if (existingUser) return res.status(400).json({ error: 'Shop email is already registered.' })
    const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({ email: shopEmail, password: shopPassword, email_confirm: true, user_metadata: { full_name: `${firstName} ${lastName}`, username: shopUsername } })
    if (signUpError) { const msg = signUpError.message || ''; if (/already registered|already exists|duplicate/i.test(msg)) return res.status(400).json({ error: 'Shop email is already registered.' }); throw signUpError }
    createdAuthUserId = signUpData.user.id
    await supabaseAdmin.from('users').update({ full_name: `${firstName} ${lastName}`, phone, role: 'seller', username: shopUsername }).eq('id', createdAuthUserId)
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
    const monthIdx = months.indexOf(dobMonth) + 1
    const dob = (dobDay && dobMonth && dobYear && monthIdx > 0) ? `${dobYear}-${String(monthIdx).padStart(2,'0')}-${String(dobDay).padStart(2,'0')}` : null
    const { data: shop, error: shopError } = await supabaseAdmin.from('shops').insert([{ user_id: createdAuthUserId, shop_username: shopUsername, shop_name: shopName, shop_email: null, shop_phone: null, has_physical_store: hasPhysicalStore === 'yes', categories: selectedCategories || [], product_condition: productCondition || 'new', has_gst: hasGst === 'yes', gst_number: gstNumber || null, status: 'pending' }]).select().single()
    if (shopError) { await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId); throw shopError }
    await supabaseAdmin.from('shop_owner_details').insert([{ shop_id: shop.id, owner_first_name: firstName, owner_last_name: lastName, owner_email: email, owner_phone: phone, dob, id_document_type: idDocumentType, id_document_number: idDocumentNumber, id_document_preview: idDocumentPreview, tax_independent: taxIndependent }])
    const accountLast4 = accountNumber ? String(accountNumber).slice(-4) : null
    await supabaseAdmin.from('shop_bank_details').insert([{ shop_id: shop.id, pay_to_name: payToName, account_number: accountNumber, account_last4: accountLast4, ifsc_code: ifscCode, account_type: accountType, bank_address: bankAddress, bank_city: bankCity, bank_country: bankCountry || 'India', bank_postal_code: bankPostalCode, bank_phone: bankPhone }])
    const { data: session } = await supabaseAnon.auth.signInWithPassword({ email: shopEmail, password: shopPassword })
    res.status(201).json({ message: 'Seller account created successfully', token: session?.session?.access_token || null, refresh_token: session?.session?.refresh_token || null, user: { id: createdAuthUserId, email: shopEmail, full_name: `${firstName} ${lastName}`, role: 'seller' }, shop: { id: shop.id, shop_name: shop.shop_name, shop_username: shop.shop_username, status: shop.status } })
  } catch (error) { console.error('Seller registration error:', error); if (createdAuthUserId) { try { await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId) } catch {} } res.status(500).json({ error: error.message || 'Registration failed' }) }
})

router.get('/profile', authMiddleware, async (req, res) => {
  try { const { data: user, error } = await supabase.from('users').select('id, email, full_name, phone, role, created_at').eq('id', req.user.id).single(); if (error) throw error; res.json({ user }) } catch (error) { res.status(500).json({ error: error.message }) }
})

router.post('/shop', authMiddleware, async (req, res) => {
  const { shop_name, description, address, city, state, gst_number } = req.body
  try { const { data: existing } = await supabase.from('shops').select('id').eq('user_id', req.user.id).single(); if (existing) return res.status(400).json({ error: 'You already have a shop' }); const { data: shop, error } = await supabase.from('shops').insert([{ user_id: req.user.id, shop_name, description, address, city, state, gst_number }]).select().single(); if (error) throw error; await supabase.from('users').update({ role: 'seller' }).eq('id', req.user.id); res.status(201).json({ message: 'Shop created successfully', shop }) } catch (error) { res.status(500).json({ error: error.message }) }
})

router.get('/shop', authMiddleware, async (req, res) => {
  try {
    const { data: shop, error } = await supabase.from('shops').select('id, user_id, shop_name, shop_username, shop_email, shop_phone, description, logo_url, cover_url, has_physical_store, categories, product_condition, has_gst, gst_number, status, created_at, show_condition_badge, custom_tag, show_category_tag, show_physical_tag, show_custom_tag, about_blocks, store_address, store_pincode, store_city, store_state').eq('user_id', req.user.id).maybeSingle()
    if (error) throw error
    if (!shop) return res.status(404).json({ error: 'Shop not found' })
    const [{ data: owner }, { data: bank }] = await Promise.all([supabase.from('shop_owner_details').select('*').eq('shop_id', shop.id).maybeSingle(), supabase.from('shop_bank_details').select('*').eq('shop_id', shop.id).maybeSingle()])
    const merged = { ...shop, owner_first_name: owner?.owner_first_name || null, owner_last_name: owner?.owner_last_name || null, owner_email: owner?.owner_email || null, owner_phone: owner?.owner_phone || null, dob: owner?.dob || null, id_document_type: owner?.id_document_type || null, id_document_preview: owner?.id_document_preview || null, kyc_verified: owner?.kyc_verified || false, pay_to_name: bank?.pay_to_name || null, account_last4: bank?.account_last4 || null, ifsc_code: bank?.ifsc_code || null, account_type: bank?.account_type || null, bank_name: bank?.bank_name || null, bank_branch: bank?.bank_branch || null, bank_address: bank?.bank_address || null, bank_city: bank?.bank_city || null, bank_country: bank?.bank_country || 'India', bank_postal_code: bank?.bank_postal_code || null, bank_phone: bank?.bank_phone || null, bank_verified: bank?.verified || false }
    res.json({ shop: merged })
  } catch (error) { console.error('GET /sellers/shop error:', error); res.status(500).json({ error: error.message }) }
})

router.get('/products', authMiddleware, async (req, res) => {
  try {
    const { data: rows, error } = await supabase.from('products').select('id, title, price_paise, original_price_paise, discount_percent, thumbnail, brand, category, status, condition, stock, display_order, created_at, listing_type, flair_tag, fitment_make, fitment_model, fitment_year_from, location, pincode, state_code').eq('seller_id', req.user.id).is('deleted_at', null).order('created_at', { ascending: false })
    if (error) throw error
    const products = (rows || []).map(p => ({ id: p.id, title: p.title, name: p.title, price: p.price_paise != null ? p.price_paise / 100 : 0, original_price: p.original_price_paise != null ? p.original_price_paise / 100 : null, price_paise: p.price_paise, original_price_paise: p.original_price_paise, discount_percent: p.discount_percent, image: p.thumbnail, thumbnail: p.thumbnail, images: [], brand: p.brand, category: p.category, status: p.status === 'active' ? 'Published' : p.status, condition: p.condition, stock: p.stock, display_order: p.display_order, created_at: p.created_at, listing_type: p.listing_type, flair_tag: p.flair_tag, vehicle_make: p.fitment_make, vehicle_model: p.fitment_model, fitment_year_from: p.fitment_year_from, year: p.fitment_year_from, location: p.location, pincode: p.pincode, state_code: p.state_code }))
    res.json({ products })
  } catch (error) { console.error('GET /sellers/products error:', error); res.status(500).json({ error: error.message }) }
})

router.get('/shop/public/:username', async (req, res) => {
  try {
    const { data: shop, error } = await supabase.from('shops').select('id, user_id, shop_name, shop_username, shop_email, shop_phone, description, logo_url, cover_url, has_physical_store, categories, product_condition, has_gst, status, created_at, show_condition_badge, custom_tag, show_category_tag, show_physical_tag, show_custom_tag, about_blocks, store_address, store_city, store_state').eq('shop_username', req.params.username).eq('status', 'active').is('deleted_at', null).maybeSingle()
    if (error || !shop) return res.status(404).json({ error: 'Shop not found' })
    res.json({ shop })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/shop/products/:userId', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query
    const { data: rows, error } = await supabase.from('products').select('id, title, price_paise, original_price_paise, discount_percent, thumbnail, brand, category, status, part_type, condition, stock, display_order, created_at, flair_tag, fitment_make, fitment_model').eq('seller_id', req.params.userId).eq('status', 'active').is('deleted_at', null).order('display_order', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false }).range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)
    if (error) throw error
    const products = (rows || []).map(p => ({ id: p.id, title: p.title, name: p.title, price: p.price_paise != null ? p.price_paise / 100 : 0, original_price: p.original_price_paise != null ? p.original_price_paise / 100 : null, price_paise: p.price_paise, discount_percent: p.discount_percent, image: p.thumbnail, thumbnail: p.thumbnail, images: [], brand: p.brand, category: p.category, status: p.status === 'active' ? 'Published' : p.status, part_type: p.part_type, condition: p.condition, stock: p.stock, display_order: p.display_order, created_at: p.created_at, flairTag: p.flair_tag, vehicle_make: p.fitment_make, vehicle_model: p.fitment_model }))
    res.json({ products })
  } catch (err) { console.error('GET /sellers/shop/products error:', err); res.status(500).json({ error: err.message }) }
})

router.get('/shop/by-seller/:sellerId', async (req, res) => {
  try { const { data: shop } = await supabase.from('shops').select('id, user_id, shop_name, shop_username, logo_url, cover_url, has_physical_store, categories, product_condition, status, show_condition_badge, custom_tag, show_category_tag, show_physical_tag, show_custom_tag, about_blocks, description').eq('user_id', req.params.sellerId).single(); if (!shop) return res.status(404).json({ error: 'Shop not found' }); res.json({ shop }) } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/resubmit', authMiddleware, async (req, res) => {
  try { const { data: shop, error } = await supabase.from('shops').select('id, status').eq('user_id', req.user.id).single(); if (error || !shop) return res.status(404).json({ error: 'Shop not found' }); if (shop.status !== 'suspended') return res.status(400).json({ error: 'Shop is not suspended' }); const { error: updateError } = await supabase.from('shops').update({ status: 'pending', resubmitted_at: new Date().toISOString() }).eq('id', shop.id); if (updateError) throw updateError; res.json({ success: true, message: 'Resubmission received.' }) } catch (err) { res.status(500).json({ error: err.message }) }
})

router.patch('/profile', authMiddleware, async (req, res) => {
  const { shop_name, description, shop_phone, shop_email, bank_city, bank_country, logo_url, cover_url, show_condition_badge, custom_tag, show_category_tag, show_physical_tag, show_custom_tag, about_blocks } = req.body
  try {
    const { data: shop, error: shopErr } = await supabase.from('shops').select('id').eq('user_id', req.user.id).maybeSingle()
    if (shopErr) throw shopErr
    if (!shop) return res.status(404).json({ error: 'Shop not found' })
    const shopUpdates = {}
    if (shop_name !== undefined) shopUpdates.shop_name = shop_name
    if (description !== undefined) shopUpdates.description = description
    if (shop_phone !== undefined && shop_phone !== '') shopUpdates.shop_phone = shop_phone
    if (shop_email !== undefined && shop_email !== '') shopUpdates.shop_email = shop_email
    if (logo_url !== undefined) shopUpdates.logo_url = logo_url
    if (cover_url !== undefined) shopUpdates.cover_url = cover_url
    if (show_condition_badge !== undefined) shopUpdates.show_condition_badge = show_condition_badge
    if (custom_tag !== undefined) shopUpdates.custom_tag = custom_tag
    if (show_category_tag !== undefined) shopUpdates.show_category_tag = show_category_tag
    if (show_physical_tag !== undefined) shopUpdates.show_physical_tag = show_physical_tag
    if (show_custom_tag !== undefined) shopUpdates.show_custom_tag = show_custom_tag
    if (about_blocks !== undefined) shopUpdates.about_blocks = about_blocks
    let updatedShop = null
    if (Object.keys(shopUpdates).length > 0) { const { data, error } = await supabase.from('shops').update(shopUpdates).eq('id', shop.id).select().single(); if (error) throw error; updatedShop = data }
    const bankUpdates = {}
    if (bank_city !== undefined) bankUpdates.bank_city = bank_city
    if (bank_country !== undefined) bankUpdates.bank_country = bank_country
    if (Object.keys(bankUpdates).length > 0) { await supabase.from('shop_bank_details').upsert({ shop_id: shop.id, ...bankUpdates }) }
    res.json({ message: 'Shop profile updated', shop: updatedShop })
  } catch (err) { console.error('PATCH /sellers/profile error:', err); res.status(500).json({ error: err.message }) }
})

router.patch('/products/order', authMiddleware, async (req, res) => {
  const { order } = req.body
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array' })
  try { const updates = order.map(({ id, display_order }) => supabase.from('products').update({ display_order }).eq('id', id).eq('seller_id', req.user.id)); await Promise.all(updates); res.json({ message: 'Order saved' }) } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router