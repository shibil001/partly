const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const productRoutes = require('./routes/products')
const sellerRoutes = require('./routes/sellers')
const cartRoutes = require('./routes/cart')
const userRoutes = require('./routes/users')
const orderRoutes = require('./routes/orders')
const notificationRoutes = require('./routes/notifications')
const messageRoutes = require('./routes/messages')
const activityRoutes = require('./routes/activity')
const wishlistRoutes = require('./routes/wishlist')
const requestRoutes = require('./routes/requests')
const individualListingsRoutes = require('./routes/individual-listings')
const marketRoutes = require('./routes/market')
const adminRoutes = require('./routes/admin')

const app = express()

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/sellers', sellerRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/wishlist', wishlistRoutes)
app.use('/api/requests', requestRoutes)
app.use('/api/individual-listings', individualListingsRoutes)
app.use('/api/market', marketRoutes)
app.use('/api/users', userRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/activity', activityRoutes)
app.use('/api/admin', adminRoutes)

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Partly API is running!' })
})

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})