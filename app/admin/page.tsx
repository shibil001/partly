"use client"
import { useState, useEffect, useCallback } from "react"
import {
  Users, Package, ShoppingBag, Store, Bell, BarChart3,
  Lock, LogOut, Search, Eye, EyeOff, CheckCircle,
  Trash2, Send, TrendingUp, AlertCircle, RefreshCw, X, Menu, Star
} from "lucide-react"

const mockBanners: any[] = [
  { id: 'b1', title: 'Free Shipping', link: '/', image: '', active: true, created_at: '2026-04-01T10:00:00Z' },
  { id: 'b2', title: 'Sell on Partly', link: '/seller/register', image: '', active: true, created_at: '2026-04-05T10:00:00Z' },
  { id: 'b3', title: '10% Off', link: '/', image: '', active: false, created_at: '2026-04-10T10:00:00Z' },
]

const mockReturns: any[] = [
  { id: 'r1', order_id: 'o2', buyer_name: 'Rahul Menon', buyer_email: 'rahul@gmail.com', seller_name: 'Thebearing Guy', product: 'Honda City Side Mirror', amount: 1200, status: 'pending', reason: 'wrong_item', description: 'Received wrong model. Need to return.', created_at: '2026-05-02T10:00:00Z' },
  { id: 'r2', order_id: 'o5', buyer_name: 'Shibil Rahman', buyer_email: 'shibil@gmail.com', seller_name: 'Kumar Pitstop', product: 'Clutch Plate', amount: 1300, status: 'accepted', reason: 'damaged', description: 'Item came damaged in packaging.', created_at: '2026-04-25T10:00:00Z', resolved_at: '2026-04-26T10:00:00Z' },
  { id: 'r3', order_id: 'o7', buyer_name: 'Rahul Menon', buyer_email: 'rahul@gmail.com', seller_name: 'Kumar Pitstop', product: 'Maruti Alto Clutch Plate', amount: 2100, status: 'rejected', reason: 'not_compatible', description: 'Does not fit my car.', created_at: '2026-04-29T10:00:00Z', resolved_at: '2026-04-30T10:00:00Z' },
]

const mockActivityLog: any[] = [
  { id: 'a1', action: 'approved_seller', target: 'Kumar Pitstop', target_id: 's1', details: 'Approved seller application', timestamp: '2026-04-24T10:00:00Z' },
  { id: 'a2', action: 'approved_seller', target: 'Thebearing Guy', target_id: 's2', details: 'Approved seller application', timestamp: '2026-04-19T10:00:00Z' },
  { id: 'a3', action: 'featured_product', target: 'Honda City Side Mirror', target_id: 'p2', details: 'Product added to featured', timestamp: '2026-04-20T14:00:00Z' },
  { id: 'a4', action: 'banned_user', target: 'Priya Nair', target_id: '5', details: 'User banned', timestamp: '2026-04-22T09:00:00Z' },
  { id: 'a5', action: 'rejected_seller', target: 'Bandidos', target_id: 's3', details: 'Rejected — incomplete documentation', timestamp: '2026-04-23T11:00:00Z' },
  { id: 'a6', action: 'resolved_dispute', target: 'Order #o6', target_id: 'd3', details: 'Dispute resolved — buyer refunded ₹450', timestamp: '2026-04-22T15:00:00Z' },
  { id: 'a7', action: 'sent_notification', target: 'All Users', target_id: null, details: 'Bulk notification sent to 4 users', timestamp: '2026-05-01T10:00:00Z' },
  { id: 'a8', action: 'updated_order', target: 'Order #o1', target_id: 'o1', details: 'Order status updated to delivered', timestamp: '2026-04-25T14:00:00Z' },
  { id: 'a9', action: 'suspended_seller', target: 'SpeedParts MK', target_id: 's5', details: 'Suspended — Selling counterfeit parts', timestamp: '2026-04-01T10:00:00Z' },
  { id: 'a10', action: 'payout_processed', target: 'Kumar Pitstop', target_id: 'pay3', details: 'Payout of ₹1,932 processed — NEFT2026042300123', timestamp: '2026-04-23T10:00:00Z' },
]

const mockDisputes: any[] = [
  {
    id: 'd1', order_id: 'o1', type: 'not_received',
    buyer_name: 'Shibil Rahman', buyer_email: 'shibil@gmail.com',
    seller_name: 'Kumar Pitstop', product: 'Front Brake Pads - Toyota Innova',
    amount: 850, status: 'open', created_at: '2026-05-01T10:00:00Z',
    description: 'I placed the order 10 days ago but have not received it yet. Tracking shows no update since Apr 28.',
    buyer_evidence: [],
    seller_response: null, seller_evidence: [], seller_response_deadline: new Date(Date.now() + 2 * 86400000).toISOString(),
    resolution: null
  },
  {
    id: 'd2', order_id: 'o2', type: 'wrong_item',
    buyer_name: 'Rahul Menon', buyer_email: 'rahul@gmail.com',
    seller_name: 'Thebearing Guy', product: 'Honda City Side Mirror',
    amount: 1200, status: 'under_review', created_at: '2026-04-28T10:00:00Z',
    description: 'I received a side mirror for a different model. I ordered Honda City 2019 but got 2015 model.',
    buyer_evidence: ['wrong_item_photo.jpg'],
    seller_response: 'We shipped the correct item as per the order. The model number on the box matches the order. Buyer may be confused about compatibility.',
    seller_evidence: ['shipment_proof.jpg'],
    seller_response_deadline: '2026-05-01T10:00:00Z',
    resolution: null
  },
  {
    id: 'd3', order_id: 'o6', type: 'damaged',
    buyer_name: 'Shibil Rahman', buyer_email: 'shibil@gmail.com',
    seller_name: 'Kumar Pitstop', product: 'Suzuki Swift Air Filter',
    amount: 450, status: 'resolved', created_at: '2026-04-20T10:00:00Z',
    description: 'Item arrived broken.',
    buyer_evidence: ['damaged_item.jpg'],
    seller_response: 'Item was packed securely. Damage must have happened during transit.',
    seller_evidence: [],
    seller_response_deadline: '2026-04-21T10:00:00Z',
    resolution: 'buyer_wins', resolved_at: '2026-04-22T10:00:00Z', refund_amount: 450
  },
]

const PARTLY_COMMISSION = 8 // 8% commission

const mockPayouts: any[] = [
  { id: 'pay1', seller_id: 's1', shop_name: 'Kumar Pitstop', owner_name: 'Kumar Radhakrishnan', bank_account: '****4521', ifsc: 'HDFC0001234', week: 'Week of 28 Apr – 4 May', orders: [{id:'o3',product:'Air Filter',amount:2100},{id:'o5',product:'Clutch Plate',amount:1300}], orders_count: 2, gross_amount: 3400, commission: Math.round(3400 * PARTLY_COMMISSION / 100), net_amount: Math.round(3400 * (100 - PARTLY_COMMISSION) / 100), status: 'requested', hold_until: '2026-05-01T10:00:00Z', created_at: '2026-04-30T10:00:00Z', paid_at: null, reference: null },
  { id: 'pay2', seller_id: 's2', shop_name: 'Thebearing Guy', owner_name: 'Mark Rashford', bank_account: '****7832', ifsc: 'ICIC0005678', week: 'Week of 28 Apr – 4 May', orders: [{id:'o2',product:'Honda City Side Mirror',amount:1200}], orders_count: 1, gross_amount: 1200, commission: Math.round(1200 * PARTLY_COMMISSION / 100), net_amount: Math.round(1200 * (100 - PARTLY_COMMISSION) / 100), status: 'on_hold', hold_until: new Date(Date.now() + 3 * 86400000).toISOString(), created_at: '2026-05-01T10:00:00Z', paid_at: null, reference: null, disputed: false },
  { id: 'pay3', seller_id: 's1', shop_name: 'Kumar Pitstop', owner_name: 'Kumar Radhakrishnan', bank_account: '****4521', ifsc: 'HDFC0001234', week: 'Week of 14 Apr – 20 Apr', orders: [{id:'o6',product:'Toyota Innova Brake Disc',amount:1400},{id:'o7',product:'Swift Shock Absorber',amount:700}], orders_count: 2, gross_amount: 2100, commission: Math.round(2100 * PARTLY_COMMISSION / 100), net_amount: Math.round(2100 * (100 - PARTLY_COMMISSION) / 100), status: 'paid', hold_until: '2026-04-22T10:00:00Z', created_at: '2026-04-15T10:00:00Z', paid_at: '2026-04-23T10:00:00Z', reference: 'NEFT2026042300123', disputed: false },

]

const ADMIN_PASSWORD = "P@rt1y_4dm1n_#2026_X9k"

const mockUsers = [
  { id: '1', full_name: 'Shibil Rahman', email: 'shibil@gmail.com', phone: '9846821643', role: 'buyer', created_at: '2026-01-15T10:00:00Z', is_banned: false },
  { id: '2', full_name: 'Kumar Radhakrishnan', email: 'kumar12@gmail.com', phone: '9846821640', role: 'seller', created_at: '2026-02-20T10:00:00Z', is_banned: false },
  { id: '3', full_name: 'Mark Rashford', email: 'hellohelmas@gmail.com', phone: '9048200362', role: 'seller', created_at: '2026-03-10T10:00:00Z', is_banned: false },
  { id: '4', full_name: 'Rahul Menon', email: 'rahul@gmail.com', phone: '9876543210', role: 'buyer', created_at: '2026-04-01T10:00:00Z', is_banned: false },
  { id: '5', full_name: 'Priya Nair', email: 'priya@gmail.com', phone: '9812345678', role: 'buyer', created_at: '2026-04-15T10:00:00Z', is_banned: true },
]

const mockShops: any[] = [
  { id: 's1', shop_name: 'Kumar Pitstop', shop_username: 'kumarpitstop', shop_email: 'kumar12@gmail.com', shop_phone: '9846821640', logo_url: null, product_condition: 'used', status: 'active', created_at: '2026-04-23T10:00:00Z', approved_at: '2026-04-24T10:00:00Z', user_id: '2', users: { full_name: 'Kumar Radhakrishnan', email: 'kumar12@gmail.com' } },
  { id: 's2', shop_name: 'Thebearing Guy', shop_username: 'bearing', shop_email: 'hellohelmas@gmail.com', shop_phone: '9048200362', logo_url: null, product_condition: 'new', status: 'active', created_at: '2026-04-18T10:00:00Z', approved_at: '2026-04-19T10:00:00Z', user_id: '3', users: { full_name: 'Mark Rashford', email: 'hellohelmas@gmail.com' } },
  { id: 's3', shop_name: 'Bandidos', shop_username: 'thehelmetguy', shop_email: 'bandidospitstop@gmail.com', shop_phone: '9846821643', logo_url: null, product_condition: 'new', status: 'pending', created_at: '2026-04-16T10:00:00Z', user_id: '1', users: { full_name: 'Shibil Rahman', email: 'kelkacommunity@gmail.com' } },
  { id: 's4', shop_name: 'AutoZone Kerala', shop_username: 'autozonekerala', shop_email: 'autozone@gmail.com', shop_phone: '9812345678', logo_url: null, product_condition: 'both', status: 'pending', created_at: '2026-05-01T10:00:00Z', user_id: '4', users: { full_name: 'Rahul Menon', email: 'rahul@gmail.com' } },
  { id: 's5', shop_name: 'SpeedParts MK', shop_username: 'speedpartsmk', shop_email: 'speedparts@gmail.com', shop_phone: '9871234560', logo_url: null, product_condition: 'used', status: 'pending', created_at: '2026-03-10T10:00:00Z', suspension_reason: 'Selling counterfeit parts', suspended_at: '2026-04-01T10:00:00Z', resubmit_deadline: '2026-05-11T10:00:00Z', resubmitted_at: '2026-05-05T10:00:00Z', user_id: '5', users: { full_name: 'Priya Nair', email: 'priya@gmail.com' } },
]

const mockProducts: any[] = [
  { id: 'p1', name: 'Front Brake Pads - Toyota Innova', price: 850, category: 'Brakes', condition: 'new', stock: 12, status: 'Published', images: [], created_at: '2026-04-20T10:00:00Z', seller_id: '2', featured: false },
  { id: 'p2', name: 'Honda City Side Mirror', price: 1200, category: 'Body Parts', condition: 'used', stock: 3, status: 'Published', images: [], created_at: '2026-04-18T10:00:00Z', seller_id: '3', featured: true },
  { id: 'p3', name: 'Suzuki Swift Air Filter', price: 450, category: 'Engine', condition: 'new', stock: 8, status: 'Published', images: [], created_at: '2026-04-15T10:00:00Z', seller_id: '2', featured: false },
  { id: 'p4', name: 'Maruti Alto Clutch Plate', price: 2100, category: 'Transmission', condition: 'used', stock: 1, status: 'Published', images: [], created_at: '2026-04-10T10:00:00Z', seller_id: '3', featured: false },
]

const mockOrders: any[] = [
  { id: 'o1', status: 'delivered', total_amount: 850, created_at: '2026-04-22T10:00:00Z', user_id: '1', seller_id: '2', users: { full_name: 'Shibil Rahman', email: 'shibil@gmail.com' }, product_name: 'Front Brake Pads', quantity: 1, tracking_number: 'TRK123456789', courier: 'Delhivery', shipping_address: '12 MG Road, Kozhikode, Kerala 673001', tracking_history: [
    { status: 'Order Placed', date: '2026-04-22T10:00:00Z', location: 'Kozhikode' },
    { status: 'Processing', date: '2026-04-22T14:00:00Z', location: 'Kozhikode' },
    { status: 'Picked Up', date: '2026-04-23T09:00:00Z', location: 'Kozhikode Hub' },
    { status: 'In Transit', date: '2026-04-23T18:00:00Z', location: 'Chennai Hub' },
    { status: 'Delivered', date: '2026-04-25T14:00:00Z', location: 'Kozhikode' },
  ]},
  { id: 'o2', status: 'pending', total_amount: 1200, created_at: '2026-04-25T10:00:00Z', user_id: '4', seller_id: '3', users: { full_name: 'Rahul Menon', email: 'rahul@gmail.com' }, product_name: 'Honda City Side Mirror', quantity: 1, tracking_number: null, courier: null, shipping_address: '45 Beach Road, Kozhikode, Kerala 673032', tracking_history: [
    { status: 'Order Placed', date: '2026-04-25T10:00:00Z', location: 'Kozhikode' },
  ]},
  { id: 'o3', status: 'shipped', total_amount: 2550, created_at: '2026-04-28T10:00:00Z', user_id: '1', seller_id: '2', users: { full_name: 'Shibil Rahman', email: 'shibil@gmail.com' }, product_name: 'Air Filter + Clutch Plate', quantity: 2, tracking_number: 'TRK987654321', courier: 'BlueDart', shipping_address: '12 MG Road, Kozhikode, Kerala 673001', tracking_history: [
    { status: 'Order Placed', date: '2026-04-28T10:00:00Z', location: 'Kozhikode' },
    { status: 'Processing', date: '2026-04-28T15:00:00Z', location: 'Kozhikode' },
    { status: 'Picked Up', date: '2026-04-29T10:00:00Z', location: 'Kozhikode Hub' },
    { status: 'In Transit', date: '2026-04-29T20:00:00Z', location: 'Bangalore Hub' },
  ]},
]

const mockConversations: any[] = [
  { id: 'conv1', user_id: '1', user_name: 'Shibil Rahman', user_email: 'shibil@gmail.com', user_role: 'buyer', subject: 'Order not received', status: 'open', created_at: '2026-05-01T10:00:00Z', messages: [
    { id: 'm1', sender: 'user', text: 'Hi, I placed an order 5 days ago but have not received it yet.', created_at: '2026-05-01T10:00:00Z' },
    { id: 'm2', sender: 'admin', text: 'Hi Shibil! Let me check that for you right away.', created_at: '2026-05-01T10:30:00Z' },
    { id: 'm3', sender: 'user', text: 'Thank you! Please let me know ASAP.', created_at: '2026-05-01T11:00:00Z' },
  ]},
  { id: 'conv2', user_id: '2', user_name: 'Kumar Radhakrishnan', user_email: 'kumar12@gmail.com', user_role: 'seller', seller_condition: 'used', subject: 'Account suspension appeal', status: 'open', created_at: '2026-05-03T10:00:00Z', messages: [
    { id: 'm4', sender: 'user', text: 'My shop was suspended but I have fixed all issues. Please review my resubmission.', created_at: '2026-05-03T10:00:00Z' },
  ]},
  { id: 'conv3', user_id: '4', user_name: 'Rahul Menon', user_email: 'rahul@gmail.com', user_role: 'buyer', subject: 'Payment issue', status: 'resolved', created_at: '2026-04-28T10:00:00Z', messages: [
    { id: 'm5', sender: 'user', text: 'I was charged twice for my order.', created_at: '2026-04-28T10:00:00Z' },
    { id: 'm6', sender: 'admin', text: 'We have processed your refund. It will reflect in 3-5 business days.', created_at: '2026-04-28T12:00:00Z' },
  ]},
  { id: 'conv4', user_id: '3', user_name: 'Mark Rashford', user_email: 'hellohelmas@gmail.com', user_role: 'seller', seller_condition: 'new', subject: 'Product listing issue', status: 'open', created_at: '2026-05-04T10:00:00Z', messages: [
    { id: 'm7', sender: 'user', text: 'My new parts listing was removed without any reason. Can you help?', created_at: '2026-05-04T10:00:00Z' },
  ]},
]

type Section = 'dashboard' | 'users' | 'sellers' | 'approvals' | 'products' | 'featured' | 'orders' | 'messages' | 'notifications' | 'banners' | 'payouts' | 'disputes' | 'activity' | 'reports'

const inp = "w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
const lbl = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5"

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [pwErr, setPwErr] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [section, setSection] = useState<Section>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  // Data
  const [users, setUsers] = useState<any[]>([])
  const [sellers, setSellers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [stats, setStats] = useState({ users: 0, sellers: 0, products: 0, orders: 0, revenue: 0 })
  const [pendingSellers, setPendingSellers] = useState<any[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [activeConv, setActiveConv] = useState<any | null>(null)
  const [adminReply, setAdminReply] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

  // Modal states
  const [selectedSeller, setSelectedSeller] = useState<any | null>(null)
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [approvalFilter, setApprovalFilter] = useState<'pending'|'active'|'rejected'|'suspended'>('pending')
  const [sellerFilter, setSellerFilter] = useState<'all'|'active'|'suspended'>('all')
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [suspendModal, setSuspendModal] = useState<{ id: string; name: string; userId: string } | null>(null)
  const [suspendReason, setSuspendReason] = useState('')
  const [convFilter, setConvFilter] = useState<'all'|'unread'|'buyers'|'new_sellers'|'used_sellers'|'resolved'|'support'>('all')

  // Notification
  const [notifTitle, setNotifTitle] = useState('')
  const [notifBody, setNotifBody] = useState('')
  const [notifTarget, setNotifTarget] = useState<'all'|'buyers'|'sellers'>('all')
  const [sending, setSending] = useState(false)
  const [banners, setBanners] = useState<any[]>([])
  const [bannerForm, setBannerForm] = useState({ title: '', link: '', active: true, image: '' })
  const [bannerUploading, setBannerUploading] = useState(false)
  const [payouts, setPayouts] = useState<any[]>([])
  const [payoutFilter, setPayoutFilter] = useState<'requested'|'on_hold'|'paid'>('requested')
  const [disputes, setDisputes] = useState<any[]>([])
  const [returns, setReturns] = useState<any[]>([])
  const [disputeFilter, setDisputeFilter] = useState<'open'|'under_review'|'resolved'>('open')
  const [disputeTab, setDisputeTab] = useState<'disputes'|'returns'>('disputes')
  const [activityLog, setActivityLog] = useState<any[]>([])
  const [payoutRef, setPayoutRef] = useState('')
  const [payingId, setPayingId] = useState<string | null>(null)
  const [editingBanner, setEditingBanner] = useState<string | null>(null)
  const [showBannerForm, setShowBannerForm] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('partly_admin') === '1') {
      setAuthed(true)
    }
  }, [])

  useEffect(() => {
    if (authed) {
      loadSection(section)
    }
  }, [authed, section])

  // Poll pending count
  useEffect(() => {
    if (!authed) return
    async function checkPending() {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL
        const [shopsRes, msgsRes] = await Promise.all([
          fetch(`${API}/api/admin/shops`),
          fetch(`${API}/api/admin/messages`),
        ])
        const [shopsData, msgsData] = await Promise.all([shopsRes.json(), msgsRes.json()])
        setPendingSellers(shopsData.shops || [])
        const convs = msgsData.conversations || []
        setUnreadCount(convs.filter((c: any) => c.status === 'open').length)
      } catch {}
    }
    checkPending()
    const interval = setInterval(checkPending, 30000)
    return () => clearInterval(interval)
  }, [authed])

  function toast(text: string, ok = true) {
    setMsg({ text, ok })
    setTimeout(() => setMsg(null), 3500)
  }

  async function logActivity(action: string, target: string, target_id: string | null, details: string) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, target, target_id, details })
      })
    } catch (e) { console.error('Activity log failed', e) }
  }

  function login() {
    if (pw === ADMIN_PASSWORD) { sessionStorage.setItem('partly_admin', '1'); setAuthed(true) }
    else setPwErr('Incorrect password')
  }

  function logout() { sessionStorage.removeItem('partly_admin'); setAuthed(false) }

  const loadSection = useCallback(async (s: Section) => {
    setLoading(true)
    const API = process.env.NEXT_PUBLIC_API_URL
    const headers = { 'Content-Type': 'application/json' }

    try {
      if (s === 'dashboard' || s === 'reports') {
        const [usersRes, shopsRes, productsRes, ordersRes] = await Promise.all([
          fetch(`${API}/api/admin/users`, { headers }),
          fetch(`${API}/api/admin/shops`, { headers }),
          fetch(`${API}/api/admin/products`, { headers }),
          fetch(`${API}/api/admin/orders`, { headers }),
        ])
        const [usersData, shopsData, productsData, ordersData] = await Promise.all([
          usersRes.json(), shopsRes.json(), productsRes.json(), ordersRes.json()
        ])
        const allOrders = ordersData.orders || []
        const revenue = allOrders.reduce((acc: number, o: any) => acc + (o.total_amount || 0), 0)
        setStats({
          users: (usersData.users || []).length,
          sellers: (shopsData.shops || []).filter((s: any) => s.status === 'active').length,
          products: (productsData.products || []).length,
          orders: allOrders.length,
          revenue
        })
      }

      if (s === 'users') {
        const res = await fetch(`${API}/api/admin/users`, { headers })
        const data = await res.json()
        setUsers(data.users || [])
      }

      if (s === 'sellers') {
        const res = await fetch(`${API}/api/admin/shops`, { headers })
        const data = await res.json()
        setSellers(data.shops || [])
      }

      if (s === 'approvals') {
        const res = await fetch(`${API}/api/admin/shops`, { headers })
        const data = await res.json()
        setPendingSellers(data.shops || [])
      }


      if (s === 'products' || s === 'featured') {
        const res = await fetch(`${API}/api/admin/products`, { headers })
        const data = await res.json()
        setProducts(data.products || [])
      }

      if (s === 'orders') {
        const res = await fetch(`${API}/api/admin/orders`, { headers })
        const data = await res.json()
        setOrders(data.orders || [])
      }

      if (s === 'activity') {
        const res = await fetch(`${API}/api/admin/activity`, { headers })
        const data = await res.json()
        setActivityLog((data.logs || []).sort((a: any, b: any) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ))
      }

      if (s === 'disputes') {
        const [disputesRes, returnsRes] = await Promise.all([
          fetch(`${API}/api/admin/disputes`, { headers }),
          fetch(`${API}/api/admin/returns`, { headers }),
        ])
        const [disputesData, returnsData] = await Promise.all([disputesRes.json(), returnsRes.json()])
        setDisputes(disputesData.disputes || [])
        setReturns(returnsData.returns || [])
      }

      if (s === 'payouts') {
        const res = await fetch(`${API}/api/admin/payouts`, { headers })
        const data = await res.json()
        setPayouts(data.payouts || [])
      }

      if (s === 'banners') {
        const res = await fetch(`${API}/api/admin/banners`, { headers })
        const data = await res.json()
        setBanners(data.banners || [])
      }

      if (s === 'messages') {
        const res = await fetch(`${API}/api/admin/messages`, { headers })
        const data = await res.json()
        const convs = data.conversations || []
        setConversations(convs)
        const unread = convs.filter((c: any) => c.status === 'open').length
        setUnreadCount(unread)
      }
    } catch (e) { console.error('Admin load error:', e) }
    setLoading(false)
  }, [])

  async function suspendSeller() {
    if (!suspendModal) return
    const deadline = new Date(); deadline.setDate(deadline.getDate() + 40)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/shops/${suspendModal.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'suspended', suspension_reason: suspendReason || 'Violation of Partly terms', resubmit_deadline: deadline.toISOString() })
      })
      toast('Seller suspended')
      logActivity('suspended_seller', suspendModal.name, suspendModal.id, `Suspended — ${suspendReason || 'Violation of Partly terms'}`)
    } catch { toast('Failed to suspend seller', false) }
    setSuspendModal(null); setSuspendReason('')
    loadSection('approvals'); loadSection('sellers')
  }

  async function rejectWithReason() {
    if (!rejectModal) return
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/shops/${rejectModal.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', rejection_reason: rejectReason || 'No reason provided' })
      })
      toast('Seller rejected')
      logActivity('rejected_seller', rejectModal.name, rejectModal.id, `Rejected — ${rejectReason || 'No reason provided'}`)
    } catch { toast('Failed to reject seller', false) }
    setRejectModal(null); setRejectReason('')
    loadSection('approvals'); loadSection('sellers')
  }

  async function updateSellerStatus(id: string, status: string) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/shops/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      toast(status === 'active' ? 'Seller approved!' : 'Status updated')
      logActivity(status === 'active' ? 'approved_seller' : 'updated_seller', id, id, `Seller status updated to ${status}`)
    } catch { toast('Failed to update seller status', false) }
    loadSection('approvals'); loadSection('sellers')
  }

  async function banUser(id: string, ban: boolean) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${id}/ban`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_banned: ban })
      })
      toast(ban ? 'User banned' : 'User unbanned')
      logActivity(ban ? 'banned_user' : 'unbanned_user', id, id, ban ? 'User banned' : 'User unbanned')
    } catch { toast('Failed to update user', false) }
    loadSection('users')
  }

  async function deleteProduct(id: string) {
    if (!confirm('Delete this product?')) return
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/products/${id}`, { method: 'DELETE' })
      toast('Product deleted')
    } catch { toast('Failed to delete product', false) }
    loadSection('products')
  }

  async function featureProduct(id: string, featured: boolean) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/products/${id}/feature`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured })
      })
      toast(featured ? 'Product featured' : 'Product unfeatured')
      logActivity(featured ? 'featured_product' : 'unfeatured_product', id, id, featured ? 'Product added to featured' : 'Product removed from featured')
    } catch { toast('Failed to update product', false) }
    loadSection(section === 'featured' ? 'featured' : 'products')
  }

  async function updateOrderStatus(id: string, status: string) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      toast('Order status updated')
    } catch { toast('Failed to update order', false) }
    loadSection('orders')
  }

  // Banner helpers
  async function toggleBannerActive(id: string, active: boolean) {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/banners/${id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ active }) })
    loadSection('banners')
  }
  async function addBanner(banner: any) {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/banners`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(banner) })
    toast('Banner added'); loadSection('banners')
  }
  async function deleteBanner(id: string) {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/banners/${id}`, { method: 'DELETE' })
    toast('Banner deleted'); loadSection('banners')
  }

  // Dispute helpers
  async function resolveDispute(id: string, decision: string) {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/disputes/${id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status: 'resolved', admin_decision: decision }) })
    toast('Dispute resolved'); loadSection('disputes')
  }
  async function updateDisputeStatus(id: string, status: string) {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/disputes/${id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status }) })
    loadSection('disputes')
  }

  // Return helpers
  async function updateReturnStatus(id: string, status: string) {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/returns/${id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status }) })
    toast(status === 'accepted' ? 'Return accepted' : 'Return rejected'); loadSection('disputes')
  }

  async function sendBulkNotification() {
    if (!notifTitle || !notifBody) { toast('Please fill title and message', false); return }
    setSending(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/notifications/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: notifTitle, body: notifBody, target: notifTarget })
      })
      const data = await res.json()
      toast(`Notification sent to ${data.count || 0} users!`)
      setNotifTitle(''); setNotifBody('')
    } catch { toast('Failed to send notification', false) }
    setSending(false)
  }

  const navItems: { key: Section; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="h-4 w-4" /> },
    { key: 'users', label: 'Users', icon: <Users className="h-4 w-4" /> },
    { key: 'sellers', label: 'Sellers', icon: <Store className="h-4 w-4" /> },
    { key: 'approvals', label: 'Approvals', icon: <CheckCircle className="h-4 w-4" />, badge: pendingSellers.filter((s: any) => s.status === 'pending').length },
    { key: 'products', label: 'Products', icon: <Package className="h-4 w-4" /> },
    { key: 'featured', label: 'Featured', icon: <Star className="h-4 w-4" /> },
    { key: 'orders', label: 'Orders', icon: <ShoppingBag className="h-4 w-4" /> },
    { key: 'messages', label: 'Messages', icon: <Bell className="h-4 w-4" />, badge: unreadCount },
    { key: 'payouts', label: 'Payouts', icon: <TrendingUp className="h-4 w-4" /> },
    { key: 'disputes', label: 'Disputes & Returns', icon: <AlertCircle className="h-4 w-4" />, badge: disputes.filter((d:any) => d.status === 'open').length + returns.filter((r:any) => r.status === 'pending').length },
    { key: 'banners', label: 'Banners', icon: <Bell className="h-4 w-4" /> },
    { key: 'notifications', label: 'Notifications', icon: <Send className="h-4 w-4" /> },
    { key: 'activity', label: 'Activity Log', icon: <RefreshCw className="h-4 w-4" /> },

  ]

  const filteredUsers = users.filter(u => !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
  const filteredSellers = sellers.filter(s => (sellerFilter === 'all' || s.status === sellerFilter) && (!search || s.shop_name?.toLowerCase().includes(search.toLowerCase())))
  const filteredProducts = products.filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()))
  const filteredOrders = orders.filter(o => !search || o.id?.includes(search) || o.status?.includes(search))

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    processed: 'bg-indigo-100 text-indigo-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-sm shadow-sm">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <h1 className="font-bold text-xl text-gray-900">Partly Admin</h1>
            <p className="text-gray-500 text-sm mt-1">Restricted access</p>
          </div>
          <div className="space-y-3">
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={pw}
                onChange={e => { setPw(e.target.value); setPwErr('') }}
                onKeyDown={e => e.key === 'Enter' && login()}
                placeholder="Admin password" className={inp} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                {showPw ? <Eye className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {pwErr && <p className="text-red-500 text-xs">{pwErr}</p>}
            <button onClick={login}
              className="w-full py-2.5 rounded-lg text-white font-semibold text-sm bg-blue-600 hover:bg-blue-700 transition-all"
              style={{ border: 'none', cursor: 'pointer' }}>
              Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 flex flex-col shrink-0 sticky top-0 h-screen">
        <div className="px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs">P</span>
            </div>
            <span className="text-white font-bold text-sm">Partly Admin</span>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button key={item.key}
              onClick={() => { setSection(item.key); setSearch(''); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${section === item.key ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
              style={{ border: 'none', cursor: 'pointer' }}>
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {(item.badge ?? 0) > 0 && (
                <span className="text-xs font-bold bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-800">
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-all"
            style={{ border: 'none', cursor: 'pointer' }}>
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-5 h-14 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-500" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-bold text-gray-900 capitalize">{section}</h1>
          </div>
          <div className="flex items-center gap-3">
            {['users','sellers','products','orders'].includes(section) && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                  className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 w-48" />
              </div>
            )}
            <button onClick={() => loadSection(section)} className="p-2 text-gray-400 hover:text-gray-600" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {msg && (
            <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg border flex items-center gap-2 ${msg.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              {msg.ok ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {msg.text}
              <button onClick={() => setMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X className="h-4 w-4" /></button>
            </div>
          )}

          {loading && <div className="flex items-center justify-center py-20"><div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>}

          {!loading && (
            <>
              {/* Dashboard */}
              {section === 'dashboard' && (
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: 'Total Users', value: stats.users, color: '#3b82f6', icon: <Users className="h-5 w-5" /> },
                      { label: 'Active Sellers', value: stats.sellers, color: '#8b5cf6', icon: <Store className="h-5 w-5" /> },
                      { label: 'Products', value: stats.products, color: '#10b981', icon: <Package className="h-5 w-5" /> },
                      { label: 'Orders', value: stats.orders, color: '#f59e0b', icon: <ShoppingBag className="h-5 w-5" /> },
                    ].map((s, i) => (
                      <div key={i} className="bg-white rounded-xl p-5 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{s.label}</p>
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: s.color + '15', color: s.color }}>{s.icon}</div>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{s.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-gray-200 mb-6">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Total Revenue</p>
                    <p className="text-4xl font-bold text-gray-900">₹{stats.revenue.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    {navItems.filter(n => !['dashboard','reports'].includes(n.key)).map(item => (
                      <button key={item.key} onClick={() => setSection(item.key)}
                        className="bg-white rounded-xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all text-left flex items-center gap-3"
                        style={{ cursor: 'pointer' }}>
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">{item.icon}</div>
                        <div>
                          <p className="font-semibold text-sm text-gray-900">Manage {item.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">View and manage all {item.label.toLowerCase()}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Users */}
              {section === 'users' && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <p className="font-semibold text-gray-900 text-sm">{filteredUsers.length} users</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                          <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u, i) => (
                          <tr key={u.id} className={`border-b border-gray-50 hover:bg-gray-50 ${i % 2 ? 'bg-gray-50/50' : ''}`}>
                            <td className="px-5 py-3">
                              <p className="font-semibold text-gray-900">{u.full_name}</p>
                              <p className="text-xs text-gray-400">{u.email}</p>
                            </td>
                            <td className="px-5 py-3">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.role === 'seller' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{u.role}</span>
                            </td>
                            <td className="px-5 py-3 text-gray-600">{u.phone || '—'}</td>
                            <td className="px-5 py-3 text-gray-500">{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                            <td className="px-5 py-3">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.is_banned ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{u.is_banned ? 'Banned' : 'Active'}</span>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => setSelectedUser(u)}
                                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                                  style={{ border: 'none', cursor: 'pointer' }}>Details</button>
                                <button onClick={() => banUser(u.id, !u.is_banned)}
                                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${u.is_banned ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                                  style={{ border: 'none', cursor: 'pointer' }}>
                                  {u.is_banned ? 'Unban' : 'Ban'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sellers */}
              {section === 'sellers' && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                    <p className="font-semibold text-gray-900 text-sm">{filteredSellers.length} sellers</p>
                    <div className="flex gap-2">
                      {(['all','active','suspended'] as const).map(f => (
                        <button key={f} onClick={() => setSellerFilter(f)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg capitalize ${sellerFilter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                          style={{ border: 'none', cursor: 'pointer' }}>
                          {f} {f !== 'all' && `(${sellers.filter(s => s.status === f).length})`}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Shop</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Owner</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Username</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                          <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSellers.map((s: any, i: number) => (
                          <tr key={s.id} className={`border-b border-gray-50 hover:bg-gray-50 ${i % 2 ? 'bg-gray-50/50' : ''}`}>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">{s.shop_name?.[0]}</div>
                                <p className="font-semibold text-gray-900">{s.shop_name}</p>
                              </div>
                            </td>
                            <td className="px-5 py-3">
                              <p className="text-gray-900">{s.users?.full_name || '—'}</p>
                              <p className="text-xs text-gray-400">{s.users?.email}</p>
                            </td>
                            <td className="px-5 py-3">
                              {s.product_condition === 'new' && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">New</span>}
                              {s.product_condition === 'used' && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">Used</span>}
                              {s.product_condition === 'both' && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Both</span>}
                            </td>
                            <td className="px-5 py-3 text-gray-500 font-mono text-xs">@{s.shop_username}</td>
                            <td className="px-5 py-3">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.status === 'active' ? 'bg-green-100 text-green-700' : s.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : s.status === 'suspended' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>{s.status}</span>
                            </td>
                            <td className="px-5 py-3 text-gray-500">{new Date(s.created_at).toLocaleDateString('en-IN')}</td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <button onClick={() => setSelectedSeller(s)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200" style={{ border: 'none', cursor: 'pointer' }}>Details</button>
                                <a href={`/shop/${s.shop_username}`} target="_blank" className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100" style={{ textDecoration: 'none' }}>Shop</a>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Approvals */}
              {section === 'approvals' && (
                <div>
                  <div className="mb-6">
                    <h2 className="font-bold text-gray-900 text-lg mb-4">Seller Applications</h2>
                    <div className="flex gap-2 flex-wrap">
                      {([
                        { key: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
                        { key: 'active', label: 'Approved', color: 'bg-green-100 text-green-700' },
                        { key: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700' },
                        { key: 'suspended', label: 'Suspended', color: 'bg-orange-100 text-orange-700' },
                      ] as const).map(f => (
                        <button key={f.key} onClick={() => setApprovalFilter(f.key)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${approvalFilter === f.key ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                          style={{ cursor: 'pointer' }}>
                          {f.label}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${approvalFilter === f.key ? 'bg-white/20 text-white' : f.color}`}>
                            {pendingSellers.filter(s => s.status === f.key).length}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {pendingSellers.filter(s => s.status === approvalFilter).length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
                      <CheckCircle className="h-10 w-10 text-green-300 mx-auto mb-3" />
                      <p className="font-semibold text-gray-500">No {approvalFilter} applications</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingSellers.filter(s => s.status === approvalFilter).map((s: any) => (
                        <div key={s.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-500">{s.shop_name?.[0]}</div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-gray-900">{s.shop_name}</p>
                                  {s.resubmitted_at && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Resubmitted</span>}
                                </div>
                                <p className="text-xs text-gray-400">
                                  {approvalFilter === 'active' && s.approved_at ? `Approved ${new Date(s.approved_at).toLocaleDateString('en-IN', {day:'numeric',month:'long',year:'numeric'})}` :
                                   approvalFilter === 'rejected' ? `Rejected · ${s.rejection_reason || 'No reason'}` :
                                   approvalFilter === 'suspended' ? `Suspended · ${s.suspension_reason || 'No reason'}` :
                                   s.resubmitted_at ? `Resubmitted ${new Date(s.resubmitted_at).toLocaleDateString('en-IN')}` :
                                   `Registered ${new Date(s.created_at).toLocaleDateString('en-IN', {day:'numeric',month:'long',year:'numeric'})}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => setSelectedSeller(s)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200" style={{ border: 'none', cursor: 'pointer' }}>View Details</button>
                              {approvalFilter === 'active' && (
                                <button onClick={() => setSuspendModal({ id: s.id, name: s.shop_name, userId: s.user_id })} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100" style={{ border: 'none', cursor: 'pointer' }}>Suspend</button>
                              )}
                              {approvalFilter === 'suspended' && (
                                <button onClick={() => updateSellerStatus(s.id, 'active')} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100" style={{ border: 'none', cursor: 'pointer' }}>Reactivate</button>
                              )}
                              {approvalFilter === 'pending' && (
                                <>
                                  <button onClick={() => setRejectModal({ id: s.id, name: s.shop_name })} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" style={{ border: 'none', cursor: 'pointer' }}>Reject</button>
                                  <button onClick={() => updateSellerStatus(s.id, 'active')} className="text-xs font-semibold px-4 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700" style={{ border: 'none', cursor: 'pointer' }}>Approve</button>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div><p className="text-xs text-gray-400 mb-0.5">Owner</p><p className="font-semibold text-gray-900">{s.users?.full_name || '—'}</p><p className="text-xs text-gray-400">{s.users?.email}</p></div>
                            <div><p className="text-xs text-gray-400 mb-0.5">Contact</p><p className="font-semibold text-gray-900">{s.shop_phone || s.owner_phone || '—'}</p></div>
                            <div>
                              <p className="text-xs text-gray-400 mb-0.5">Type</p>
                              {s.product_condition === 'new' && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">New</span>}
                              {s.product_condition === 'used' && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">Used</span>}
                              {s.product_condition === 'both' && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Both</span>}
                            </div>
                            <div><p className="text-xs text-gray-400 mb-0.5">GST</p><p className="font-semibold text-gray-900">{s.has_gst ? s.gst_number || 'Yes' : 'No GST'}</p></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Products */}
              {section === 'products' && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <p className="font-semibold text-gray-900 text-sm">{filteredProducts.length} products</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Featured</th>
                          <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map((p: any, i: number) => (
                          <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50 ${i % 2 ? 'bg-gray-50/50' : ''}`}>
                            <td className="px-5 py-3"><p className="font-semibold text-gray-900 truncate max-w-[200px]">{p.name}</p></td>
                            <td className="px-5 py-3 text-gray-600">{p.category}</td>
                            <td className="px-5 py-3 font-semibold">₹{p.price?.toLocaleString('en-IN')}</td>
                            <td className="px-5 py-3">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}</span>
                            </td>
                            <td className="px-5 py-3">
                              {p.featured && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Featured</span>}
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => featureProduct(p.id, !p.featured)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100" style={{ border: 'none', cursor: 'pointer' }}>{p.featured ? 'Unfeature' : 'Feature'}</button>
                                <button onClick={() => deleteProduct(p.id)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" style={{ border: 'none', cursor: 'pointer' }}><Trash2 className="h-3.5 w-3.5" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Featured */}
              {section === 'featured' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="font-bold text-gray-900 text-lg">Featured Products</h2>
                      <p className="text-sm text-gray-500 mt-0.5">{products.filter(p => p.featured).length} featured · Max 8</p>
                    </div>
                  </div>
                  {products.filter(p => p.featured).length >= 8 && (
                    <div className="mb-4 px-4 py-3 rounded-xl bg-yellow-50 border border-yellow-200 flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-600 shrink-0" />
                      <p className="text-sm text-yellow-800 font-medium">Maximum 8 featured products reached. Remove one to add another.</p>
                    </div>
                  )}
                  <div className="mb-8">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Currently Featured</p>
                    {products.filter(p => p.featured).length === 0 ? (
                      <div className="bg-white rounded-xl border border-gray-200 py-10 text-center">
                        <Star className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">No featured products yet</p>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {products.filter(p => p.featured).map((p: any) => (
                          <div key={p.id} className="bg-white rounded-xl border-2 border-yellow-300 overflow-hidden">
                            <div className="h-32 bg-gray-100 flex items-center justify-center relative">
                              <Package className="h-10 w-10 text-gray-300" />
                              <div className="absolute top-2 left-2 flex items-center gap-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
                                <Star className="h-3 w-3" /> Featured
                              </div>
                            </div>
                            <div className="p-3">
                              <p className="font-semibold text-gray-900 text-sm mb-1 truncate">{p.name}</p>
                              <div className="flex items-center justify-between">
                                <p className="font-bold text-gray-900">₹{p.price?.toLocaleString('en-IN')}</p>
                                <button onClick={() => featureProduct(p.id, false)} className="text-xs font-semibold px-2 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" style={{ border: 'none', cursor: 'pointer' }}>Remove</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Add to Featured</p>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50">
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock</th>
                            <th className="px-5 py-3"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.filter(p => !p.featured).map((p: any, i: number) => (
                            <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50 ${i % 2 ? 'bg-gray-50/50' : ''}`}>
                              <td className="px-5 py-3"><p className="font-semibold text-gray-900 truncate max-w-[200px]">{p.name}</p></td>
                              <td className="px-5 py-3 text-gray-600">{p.category}</td>
                              <td className="px-5 py-3 font-semibold">₹{p.price?.toLocaleString('en-IN')}</td>
                              <td className="px-5 py-3">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}</span>
                              </td>
                              <td className="px-5 py-3 text-right">
                                <button
                                  onClick={() => featureProduct(p.id, true)}
                                  disabled={products.filter(p => p.featured).length >= 8}
                                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100 disabled:opacity-40 ml-auto"
                                  style={{ border: 'none', cursor: 'pointer' }}>
                                  <Star className="h-3.5 w-3.5" /> Feature
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Orders */}
              {section === 'orders' && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <p className="font-semibold text-gray-900 text-sm">{filteredOrders.length} orders</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order ID</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Buyer</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                          <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((o: any, i: number) => (
                          <tr key={o.id} className={`border-b border-gray-50 hover:bg-gray-50 ${i % 2 ? 'bg-gray-50/50' : ''}`}>
                            <td className="px-5 py-3 font-mono text-xs text-gray-500">{o.id.slice(0,8)}...</td>
                            <td className="px-5 py-3">
                              <p className="font-semibold text-gray-900">{o.users?.full_name || '—'}</p>
                              <p className="text-xs text-gray-400">{o.users?.email}</p>
                            </td>
                            <td className="px-5 py-3 font-semibold">₹{o.total_amount?.toLocaleString('en-IN') || '—'}</td>
                            <td className="px-5 py-3 text-gray-500">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                            <td className="px-5 py-3">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[o.status] || 'bg-gray-100 text-gray-600'}`}>{o.status}</span>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => setSelectedOrder(o)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200" style={{ border: 'none', cursor: 'pointer' }}>Details</button>
                                <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none bg-white">
                                  {['pending','confirmed','processed','shipped','delivered','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Messages */}
              {section === 'messages' && (
                <div className="flex gap-5 h-[calc(100vh-120px)]">
                  <div className="w-72 shrink-0 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-bold text-gray-900 text-sm mb-2">Support Conversations</p>
                      <div className="flex gap-1 flex-wrap">
                        {([
                          { key: 'all', label: 'All' },
                          { key: 'support', label: 'Support' },
                          { key: 'unread', label: 'Unread' },
                          { key: 'buyers', label: 'Buyers' },
                          { key: 'new_sellers', label: 'New Parts' },
                          { key: 'used_sellers', label: 'Used Parts' },
                          { key: 'resolved', label: 'Resolved' },
                        ] as const).map(f => {
                          const SUPPORT_ID = process.env.NEXT_PUBLIC_SUPPORT_USER_ID || ''
                          const count = f.key === 'all' ? conversations.length
                            : f.key === 'support' ? conversations.filter((c: any) => c.id.includes(SUPPORT_ID)).length
                            : f.key === 'unread' ? conversations.filter((c: any) => c.status === 'open' && c.messages[c.messages.length-1]?.sender === 'user').length
                            : f.key === 'buyers' ? conversations.filter((c: any) => c.user_role === 'buyer' && c.status === 'open').length
                            : f.key === 'new_sellers' ? conversations.filter((c: any) => c.user_role === 'seller' && c.seller_condition === 'new' && c.status === 'open').length
                            : f.key === 'used_sellers' ? conversations.filter((c: any) => c.user_role === 'seller' && c.seller_condition === 'used' && c.status === 'open').length
                            : conversations.filter((c: any) => c.status === 'resolved').length
                          return (
                            <button key={f.key} onClick={() => setConvFilter(f.key)}
                              className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${convFilter === f.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                              style={{ border: 'none', cursor: 'pointer' }}>
                              {f.label}{count > 0 ? ` (${count})` : ''}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {conversations.filter((c: any) => {
                        const SUPPORT_ID = process.env.NEXT_PUBLIC_SUPPORT_USER_ID || ''
                        if (convFilter === 'all') return true
                        if (convFilter === 'support') return c.id.includes(SUPPORT_ID)
                        if (convFilter === 'unread') return c.status === 'open' && c.messages[c.messages.length-1]?.sender === 'user'
                        if (convFilter === 'buyers') return c.user_role === 'buyer' && c.status === 'open'
                        if (convFilter === 'new_sellers') return c.user_role === 'seller' && c.seller_condition === 'new' && c.status === 'open'
                        if (convFilter === 'used_sellers') return c.user_role === 'seller' && c.seller_condition === 'used' && c.status === 'open'
                        if (convFilter === 'resolved') return c.status === 'resolved'
                        return true
                      }).map((c: any) => (
                        <button key={c.id} onClick={() => setActiveConv(c)}
                          className="w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                          style={{ borderTop: 'none', borderRight: 'none', borderBottom: '0.5px solid #f3f4f6', borderLeft: activeConv?.id === c.id ? '2px solid #2563eb' : '2px solid transparent', background: activeConv?.id === c.id ? '#eff6ff' : 'transparent', cursor: 'pointer' }}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <div className={`w-2 h-2 rounded-full shrink-0 ${c.status === 'open' && c.messages[c.messages.length-1]?.sender === 'user' ? 'bg-blue-500' : 'bg-transparent'}`} />
                              <p className="font-semibold text-sm text-gray-900">{c.user_name}</p>
                            </div>
                            <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString('en-IN', {day:'numeric',month:'short'})}</span>
                          </div>
                          <p className="text-xs text-gray-500 truncate mb-1.5 pl-3.5">{c.subject}</p>
                          <div className="flex gap-1 pl-3.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'resolved' ? 'bg-gray-100 text-gray-500' : c.user_role === 'seller' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{c.user_role}</span>
                            {c.user_role === 'seller' && c.seller_condition && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${c.seller_condition === 'new' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{c.seller_condition}</span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{c.status}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeConv ? (
                    <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col">
                      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm">{activeConv.user_name?.[0]}</div>
                          <div>
                            <p className="font-bold text-gray-900">{activeConv.user_name}</p>
                            <p className="text-xs text-gray-400">@{activeConv.user_name?.toLowerCase().replace(/\s/g,'')} · {activeConv.subject}</p>
                          </div>
                        </div>
                        <button onClick={() => {
                          const stored = JSON.parse(localStorage.getItem('mock_conversations') || '[]')
                          const updated = stored.map((c: any) => c.id === activeConv.id ? { ...c, status: c.status === 'open' ? 'resolved' : 'open' } : c)
                          localStorage.setItem('mock_conversations', JSON.stringify(updated))
                          setConversations(updated)
                          setActiveConv(updated.find((c: any) => c.id === activeConv.id))
                        }}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${activeConv.status === 'open' ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          style={{ border: 'none', cursor: 'pointer' }}>
                          {activeConv.status === 'open' ? 'Mark Resolved' : 'Reopen'}
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-5 space-y-3">
                        {activeConv.messages.map((m: any) => (
                          <div key={m.id} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs lg:max-w-md px-4 py-2.5 text-sm ${m.sender === 'admin' ? 'bg-blue-600 text-white rounded-xl rounded-br-none' : 'bg-gray-100 text-gray-900 rounded-xl rounded-bl-none'}`}>
                              <p style={{ margin: 0 }}>{m.text}</p>
                              <p className={`text-xs mt-1 ${m.sender === 'admin' ? 'text-blue-200' : 'text-gray-400'}`} style={{ margin: 0 }}>
                                {new Date(m.created_at).toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit'})}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {activeConv.status === 'open' && (
                        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
                          <input value={adminReply} onChange={e => setAdminReply(e.target.value)}
                            onKeyDown={async e => {
                              if (e.key === 'Enter' && adminReply.trim()) {
                                const text = adminReply.trim()
                                setAdminReply('')
                                // Find recipient — the non-support user in the conversation
                                const SUPPORT_ID = process.env.NEXT_PUBLIC_SUPPORT_USER_ID || ''
                                const recipientId = activeConv.id.replace(SUPPORT_ID, '').replace('_', '')
                                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/messages/reply`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ recipient_id: recipientId, content: text })
                                })
                                loadSection('messages')
                              }
                            }}
                            placeholder="Type a reply and press Enter..."
                            className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 bg-gray-50" />
                          <button onClick={async () => {
                            if (!adminReply.trim()) return
                            const text = adminReply.trim()
                            setAdminReply('')
                            const SUPPORT_ID = process.env.NEXT_PUBLIC_SUPPORT_USER_ID || ''
                            const recipientId = activeConv.id.replace(SUPPORT_ID, '').replace('_', '')
                            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/messages/reply`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ recipient_id: recipientId, content: text })
                            })
                            loadSection('messages')
                          }}
                            className="px-5 py-2.5 bg-blue-600 text-white rounded-full text-sm font-semibold hover:bg-blue-700"
                            style={{ border: 'none', cursor: 'pointer' }}>
                            Send
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 bg-white rounded-xl border border-gray-200 flex items-center justify-center">
                      <div className="text-center">
                        <Bell className="h-10 w-10 mx-auto mb-3 text-gray-200" />
                        <p className="font-medium text-sm text-gray-400">Select a conversation</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Payouts */}
              {section === 'payouts' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="font-bold text-gray-900 text-lg">Seller Payouts</h2>
                      <p className="text-sm text-gray-500 mt-0.5">8% commission · 7-day hold after delivery</p>
                    </div>
                  </div>

                  {/* Summary cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: 'Ready to Pay', value: `₹${payouts.filter((p:any)=>p.status==='requested').reduce((a:number,p:any)=>a+p.net_amount,0).toLocaleString('en-IN')}`, sub: `${payouts.filter((p:any)=>p.status==='requested').length} sellers`, color: 'bg-blue-50 border-blue-200 text-blue-800' },
                      { label: 'On Hold', value: payouts.filter((p:any)=>p.status==='on_hold').length, sub: '7-day wait', color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
                
                      { label: 'Total Paid', value: `₹${payouts.filter((p:any)=>p.status==='paid').reduce((a:number,p:any)=>a+p.net_amount,0).toLocaleString('en-IN')}`, sub: 'All time', color: 'bg-green-50 border-green-200 text-green-800' },
                    ].map((s:any, i:number) => (
                      <div key={i} className={`rounded-xl p-4 border ${s.color}`}>
                        <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-1">{s.label}</p>
                        <p className="text-2xl font-bold">{s.value}</p>
                        <p className="text-xs opacity-60 mt-0.5">{s.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-2 mb-5 flex-wrap">
                    {([
                      { key: 'requested', label: 'Ready to Pay', color: 'bg-blue-100 text-blue-700' },
                      { key: 'on_hold', label: 'On Hold', color: 'bg-yellow-100 text-yellow-700' },
                      { key: 'paid', label: 'Paid', color: 'bg-green-100 text-green-700' },
                    ] as const).map(f => (
                      <button key={f.key} onClick={() => setPayoutFilter(f.key as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${payoutFilter === f.key ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        style={{ cursor: 'pointer' }}>
                        {f.label}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${payoutFilter === f.key ? 'bg-white/20 text-white' : f.color}`}>
                          {payouts.filter((p:any) => p.status === f.key).length}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Payout cards */}
                  <div className="space-y-4">
                    {payouts.filter((p:any) => p.status === payoutFilter).length === 0 ? (
                      <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
                        <TrendingUp className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                        <p className="font-semibold text-gray-500">No {payoutFilter === 'requested' ? 'pending' : payoutFilter} payouts</p>
                      </div>
                    ) : payouts.filter((p:any) => p.status === payoutFilter).map((p:any) => {
                      const daysLeft = Math.max(0, Math.ceil((new Date(p.hold_until).getTime() - Date.now()) / 86400000))
                      return (
                        <div key={p.id} className={`bg-white rounded-xl border overflow-hidden ${p.disputed ? 'border-red-300' : 'border-gray-200'}`}>

                          <div className="p-5">
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 shrink-0">
                                  {p.shop_name?.[0]}
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900">{p.shop_name}</p>
                                  <p className="text-xs text-gray-400">{p.owner_name}</p>
                                  <p className="text-xs font-semibold text-gray-500 mt-0.5">{p.week}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-gray-900">₹{p.net_amount.toLocaleString('en-IN')}</p>
                                <p className="text-xs text-gray-400">Gross ₹{p.gross_amount.toLocaleString('en-IN')} − 8% (₹{p.commission.toLocaleString('en-IN')})</p>
                              </div>
                            </div>

                            {/* Batched orders breakdown */}
                            <div className="bg-gray-50 rounded-xl p-3 mb-4">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Orders in this batch</p>
                              <div className="space-y-1.5 mb-2">
                                {(p.orders || []).map((o: any) => (
                                  <div key={o.id} className="flex items-center justify-between text-xs px-2 py-1.5">
                                    <span className="text-gray-600 truncate max-w-[200px]">{o.product}</span>
                                    <span className="font-semibold text-gray-900 shrink-0 ml-2">₹{o.amount.toLocaleString('en-IN')}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="border-t border-gray-200 pt-2 space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-500">Commission 8%</span>
                                  <span className="text-gray-500">−₹{p.commission.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-200">
                                  <span className="font-bold text-green-700">Paying this Monday</span>
                                  <span className="font-bold text-green-700 text-sm">₹{p.net_amount.toLocaleString('en-IN')}</span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 py-4 border-t border-b border-gray-100 mb-4">
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">Bank Account</p>
                                <p className="text-sm font-semibold font-mono">{p.bank_account}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">IFSC</p>
                                <p className="text-sm font-semibold font-mono">{p.ifsc}</p>
                              </div>
                              <div>
                                {p.status === 'on_hold' && <>
                                  <p className="text-xs text-gray-400 mb-0.5">Hold releases in</p>
                                  <p className={`text-sm font-bold ${daysLeft <= 1 ? 'text-green-600' : 'text-orange-600'}`}>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</p>
                                </>}
                                {p.status === 'requested' && (() => {
                                  const now = new Date()
                                  const day = now.getDay()
                                  const daysToMonday = day === 0 ? 1 : 8 - day
                                  const nextMonday = new Date(now)
                                  nextMonday.setDate(now.getDate() + daysToMonday)
                                  return <>
                                    <p className="text-xs text-gray-400 mb-0.5">Next payout</p>
                                    <p className="text-sm font-bold text-blue-600">Every Monday</p>
                                    <p className="text-xs text-gray-400">{nextMonday.toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</p>
                                  </>
                                })()}
                                {p.status === 'paid' && <>
                                  <p className="text-xs text-gray-400 mb-0.5">Paid on</p>
                                  <p className="text-sm font-semibold text-green-700">{new Date(p.paid_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>
                                </>}
                                {p.status === 'disputed' && <>
                                  <p className="text-xs text-gray-400 mb-0.5">Disputed on</p>
                                  <p className="text-sm font-semibold text-red-600">{new Date(p.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</p>
                                </>}
                              </div>
                            </div>

                            {p.status === 'paid' && p.reference && (
                              <div className="px-3 py-2 bg-green-50 rounded-lg border border-green-100 mb-4 flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                <p className="text-xs text-green-700">Reference: <span className="font-mono font-semibold">{p.reference}</span></p>
                              </div>
                            )}

                            {/* Razorpay auto-processes requested payouts */}
                            {p.status === 'requested' && (
                              <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                <p className="text-xs text-blue-700 font-medium">Razorpay will automatically transfer ₹{p.net_amount.toLocaleString('en-IN')} to seller's bank account</p>
                              </div>
                            )}


                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Disputes & Returns */}
              {section === 'disputes' && (
                <div>
                  <div className="mb-6">
                    <h2 className="font-bold text-gray-900 text-lg">Disputes & Returns</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Manage buyer disputes and return requests</p>
                  </div>

                  {/* Main tabs */}
                  <div className="flex gap-2 mb-6 border-b border-gray-200">
                    {([
                      { key: 'disputes', label: 'Disputes', count: disputes.filter((d:any)=>d.status==='open'||d.status==='under_review').length },
                      { key: 'returns', label: 'Returns', count: returns.filter((r:any)=>r.status==='pending').length },
                    ] as const).map(t => (
                      <button key={t.key} onClick={() => setDisputeTab(t.key)}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${disputeTab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        style={{ background: 'none', cursor: 'pointer' }}>
                        {t.label}
                        {t.count > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">{t.count}</span>}
                      </button>
                    ))}
                  </div>

                  {/* DISPUTES TAB */}
                  {disputeTab === 'disputes' && (
                    <div>
                      <div className="grid grid-cols-3 gap-4 mb-5">
                        {[
                          { label: 'Open', value: disputes.filter((d:any)=>d.status==='open').length, color: 'bg-red-50 border-red-200 text-red-800' },
                          { label: 'Under Review', value: disputes.filter((d:any)=>d.status==='under_review').length, color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
                          { label: 'Resolved', value: disputes.filter((d:any)=>d.status==='resolved').length, color: 'bg-green-50 border-green-200 text-green-800' },
                        ].map((s:any,i:number) => (
                          <div key={i} className={`rounded-xl p-4 border ${s.color}`}>
                            <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-1">{s.label}</p>
                            <p className="text-2xl font-bold">{s.value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 mb-4">
                        {([
                          { key: 'open', label: 'Open', color: 'bg-red-100 text-red-700' },
                          { key: 'under_review', label: 'Under Review', color: 'bg-yellow-100 text-yellow-700' },
                          { key: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-700' },
                        ] as const).map(f => (
                          <button key={f.key} onClick={() => setDisputeFilter(f.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${disputeFilter === f.key ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            style={{ cursor: 'pointer' }}>
                            {f.label}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${disputeFilter === f.key ? 'bg-white/20 text-white' : f.color}`}>
                              {disputes.filter((d:any)=>d.status===f.key).length}
                            </span>
                          </button>
                        ))}
                      </div>

                      <div className="space-y-4">
                        {disputes.filter((d:any)=>d.status===disputeFilter).length === 0 ? (
                          <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
                            <CheckCircle className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                            <p className="font-semibold text-gray-500">No {disputeFilter.replace('_',' ')} disputes</p>
                          </div>
                        ) : disputes.filter((d:any)=>d.status===disputeFilter).map((d:any) => (
                          <div key={d.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                  d.type==='not_received'?'bg-red-100 text-red-700':
                                  d.type==='wrong_item'?'bg-orange-100 text-orange-700':
                                  d.type==='damaged'?'bg-purple-100 text-purple-700':'bg-blue-100 text-blue-700'}`}>
                                  {d.type==='not_received'?'Not Received':d.type==='wrong_item'?'Wrong Item':d.type==='damaged'?'Damaged':'Return'}
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900 text-sm">{d.product}</p>
                                  <p className="text-xs text-gray-400">Order #{d.order_id} · {new Date(d.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</p>
                                </div>
                              </div>
                              <p className="font-bold text-gray-900 text-lg">₹{d.amount.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="p-5 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                  <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-2">Buyer</p>
                                  <p className="font-semibold text-gray-900 text-sm">{d.buyer_name}</p>
                                  <p className="text-xs text-gray-400 mb-3">{d.buyer_email}</p>
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Claim</p>
                                  <p className="text-sm text-gray-700 mb-3">{d.description}</p>
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Evidence</p>
                                  {(d.buyer_evidence?.length ?? 0) > 0 ? (
                                    <div className="flex gap-2 flex-wrap">
                                      {d.buyer_evidence.map((img: string, idx: number) => (
                                        <div key={idx} className="w-24 h-16 rounded-lg border border-blue-200 bg-blue-100 flex items-center justify-center text-center p-1">
                                          <p className="text-xs text-blue-600 font-medium leading-tight">{img.replace('.jpg','').replace(/_/g,' ')}</p>
                                        </div>
                                      ))}
                                    </div>
                                  ) : <p className="text-xs text-gray-400">No evidence uploaded</p>}
                                </div>
                                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                                  <p className="text-xs font-semibold text-purple-500 uppercase tracking-wide mb-2">Seller</p>
                                  <p className="font-semibold text-gray-900 text-sm mb-3">{d.seller_name}</p>
                                  {d.seller_response ? (
                                    <>
                                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Response</p>
                                      <p className="text-sm text-gray-700 mb-3">{d.seller_response}</p>
                                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Evidence</p>
                                      {(d.seller_evidence?.length ?? 0) > 0 ? (
                                        <div className="flex gap-2 flex-wrap">
                                          {d.seller_evidence.map((img: string, idx: number) => (
                                            <div key={idx} className="w-24 h-16 rounded-lg border border-purple-200 bg-purple-100 flex items-center justify-center text-center p-1">
                                              <p className="text-xs text-purple-600 font-medium leading-tight">{img.replace('.jpg','').replace(/_/g,' ')}</p>
                                            </div>
                                          ))}
                                        </div>
                                      ) : <p className="text-xs text-gray-400">No evidence uploaded</p>}
                                    </>
                                  ) : (
                                    <div className={`px-3 py-2 rounded-lg text-xs font-medium ${Math.max(0, Math.ceil((new Date(d.seller_response_deadline).getTime() - Date.now()) / 86400000)) === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                      {Math.max(0, Math.ceil((new Date(d.seller_response_deadline).getTime() - Date.now()) / 86400000)) === 0
                                        ? 'No response — deadline passed'
                                        : `Awaiting seller response · ${Math.max(0, Math.ceil((new Date(d.seller_response_deadline).getTime() - Date.now()) / 86400000))} days left`}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {d.status === 'resolved' && (
                                <div className={`rounded-xl p-4 border ${d.resolution==='buyer_wins'?'bg-green-50 border-green-200':'bg-blue-50 border-blue-200'}`}>
                                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${d.resolution==='buyer_wins'?'text-green-600':'text-blue-600'}`}>
                                    {d.resolution==='buyer_wins'?'Resolved — Buyer Refunded':'Resolved — Seller Wins'}
                                  </p>
                                  {d.refund_amount && <p className="text-sm font-semibold text-green-700">Refunded: ₹{d.refund_amount.toLocaleString('en-IN')}</p>}
                                  <p className="text-xs text-gray-400 mt-0.5">Resolved on {new Date(d.resolved_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>
                                </div>
                              )}

                              {d.status === 'open' && (
                                <div className="pt-2 border-t border-gray-100">
                                  <button onClick={() => {
                                    const stored = JSON.parse(localStorage.getItem('mock_disputes')||'[]')
                                    const updated = stored.map((x:any)=>x.id===d.id?{...x,status:'under_review'}:x)
                                    localStorage.setItem('mock_disputes',JSON.stringify(updated))
                                    setDisputes(updated)
                                    toast('Marked as under review — seller notified')
                                  }} className="px-4 py-2 rounded-lg text-sm font-semibold bg-yellow-50 text-yellow-700 hover:bg-yellow-100" style={{ border:'none', cursor:'pointer' }}>
                                    Start Review
                                  </button>
                                </div>
                              )}

                              {d.status === 'under_review' && (
                                <div className="pt-2 border-t border-gray-100">
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Admin Decision</p>
                                  <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => {
                                      const stored = JSON.parse(localStorage.getItem('mock_disputes')||'[]')
                                      const updated = stored.map((x:any)=>x.id===d.id?{...x,status:'resolved',resolution:'buyer_wins',refund_amount:d.amount,resolved_at:new Date().toISOString()}:x)
                                      localStorage.setItem('mock_disputes',JSON.stringify(updated))
                                      setDisputes(updated)
                                      logActivity('resolved_dispute', d.product, d.id, `Dispute resolved — buyer refunded`)
                                      toast('Resolved — Buyer refunded')
                                    }} className="py-3 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700" style={{ border:'none', cursor:'pointer' }}>
                                      <p>Buyer Wins</p>
                                      <p className="text-xs opacity-80 mt-0.5">Refund ₹{d.amount.toLocaleString('en-IN')} to buyer</p>
                                    </button>
                                    <button onClick={() => {
                                      const stored = JSON.parse(localStorage.getItem('mock_disputes')||'[]')
                                      const updated = stored.map((x:any)=>x.id===d.id?{...x,status:'resolved',resolution:'seller_wins',resolved_at:new Date().toISOString()}:x)
                                      localStorage.setItem('mock_disputes',JSON.stringify(updated))
                                      setDisputes(updated)
                                      logActivity('resolved_dispute', d.product, d.id, 'Dispute resolved — seller wins')
                                      toast('Resolved — Seller wins')
                                    }} className="py-3 rounded-xl text-sm font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100" style={{ border:'none', cursor:'pointer' }}>
                                      <p>Seller Wins</p>
                                      <p className="text-xs opacity-80 mt-0.5">Release payout to seller</p>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* RETURNS TAB */}
                  {disputeTab === 'returns' && (
                    <div>
                      <div className="grid grid-cols-3 gap-4 mb-5">
                        {[
                          { label: 'Pending', value: returns.filter((r:any)=>r.status==='pending').length, color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
                          { label: 'Accepted', value: returns.filter((r:any)=>r.status==='accepted').length, color: 'bg-green-50 border-green-200 text-green-800' },
                          { label: 'Rejected', value: returns.filter((r:any)=>r.status==='rejected').length, color: 'bg-red-50 border-red-200 text-red-800' },
                        ].map((s:any,i:number) => (
                          <div key={i} className={`rounded-xl p-4 border ${s.color}`}>
                            <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-1">{s.label}</p>
                            <p className="text-2xl font-bold">{s.value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-4">
                        {returns.length === 0 ? (
                          <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
                            <CheckCircle className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                            <p className="font-semibold text-gray-500">No return requests</p>
                          </div>
                        ) : returns.map((r:any) => (
                          <div key={r.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                  r.reason==='wrong_item'?'bg-orange-100 text-orange-700':
                                  r.reason==='damaged'?'bg-purple-100 text-purple-700':'bg-gray-100 text-gray-700'}`}>
                                  {r.reason==='wrong_item'?'Wrong Item':r.reason==='damaged'?'Damaged':'Not Compatible'}
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900 text-sm">{r.product}</p>
                                  <p className="text-xs text-gray-400">Order #{r.order_id} · {new Date(r.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <p className="font-bold text-gray-900 text-lg">₹{r.amount.toLocaleString('en-IN')}</p>
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                  r.status==='pending'?'bg-yellow-100 text-yellow-700':
                                  r.status==='accepted'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>
                                  {r.status}
                                </span>
                              </div>
                            </div>
                            <div className="p-5 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 rounded-xl p-3">
                                  <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-1">Buyer</p>
                                  <p className="font-semibold text-gray-900 text-sm">{r.buyer_name}</p>
                                  <p className="text-xs text-gray-400">{r.buyer_email}</p>
                                </div>
                                <div className="bg-purple-50 rounded-xl p-3">
                                  <p className="text-xs font-semibold text-purple-500 uppercase tracking-wide mb-1">Seller</p>
                                  <p className="font-semibold text-gray-900 text-sm">{r.seller_name}</p>
                                </div>
                              </div>
                              <div className="bg-gray-50 rounded-xl p-3">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Reason</p>
                                <p className="text-sm text-gray-700">{r.description}</p>
                              </div>
                              {r.status === 'pending' && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Admin Action</p>
                                  <p className="text-xs text-gray-400 mb-3">If seller rejected or ignored this return, you can escalate it to a dispute or override.</p>
                                  <div className="flex gap-2">
                                    <button onClick={() => {
                                      const stored = JSON.parse(localStorage.getItem('mock_returns')||'[]')
                                      const updated = stored.map((x:any)=>x.id===r.id?{...x,status:'accepted',resolved_at:new Date().toISOString()}:x)
                                      localStorage.setItem('mock_returns',JSON.stringify(updated))
                                      setReturns(updated)
                                      toast('Return accepted — refund initiated')
                                    }} className="px-4 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700" style={{ border:'none', cursor:'pointer' }}>
                                      Accept Return
                                    </button>
                                    <button onClick={() => {
                                      const newDispute = { id:`d${Date.now()}`, order_id:r.order_id, type:'return_request', buyer_name:r.buyer_name, buyer_email:r.buyer_email, seller_name:r.seller_name, product:r.product, amount:r.amount, status:'open', created_at:new Date().toISOString(), description:r.description, resolution:null }
                                      const stored = JSON.parse(localStorage.getItem('mock_disputes')||'[]')
                                      localStorage.setItem('mock_disputes',JSON.stringify([...stored, newDispute]))
                                      const storedR = JSON.parse(localStorage.getItem('mock_returns')||'[]')
                                      const updated = storedR.map((x:any)=>x.id===r.id?{...x,status:'rejected'}:x)
                                      localStorage.setItem('mock_returns',JSON.stringify(updated))
                                      setReturns(updated)
                                      setDisputes([...stored, newDispute])
                                      setDisputeTab('disputes')
                                      toast('Escalated to dispute')
                                    }} className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100" style={{ border:'none', cursor:'pointer' }}>
                                      Escalate to Dispute
                                    </button>
                                  </div>
                                </div>
                              )}
                              {r.status !== 'pending' && r.resolved_at && (
                                <p className="text-xs text-gray-400">Resolved on {new Date(r.resolved_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Banners */}
              {section === 'banners' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="font-bold text-gray-900 text-lg">Banners</h2>
                      <p className="text-sm text-gray-500 mt-0.5">Manage promotional banners shown on the login page</p>
                    </div>
                    <button onClick={() => { setShowBannerForm(true); setEditingBanner(null); setBannerForm({ title: '', link: '', active: true, image: '' }) }}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold bg-blue-600 hover:bg-blue-700"
                      style={{ border: 'none', cursor: 'pointer' }}>
                      + Add Banner
                    </button>
                  </div>

                  {/* Banner Form */}
                  {showBannerForm && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                      <h3 className="font-bold text-gray-900 mb-4">{editingBanner ? 'Edit Banner' : 'New Banner'}</h3>
                      <div className="space-y-4 mb-4">
                        <div><label className={lbl}>Banner Title <span className="normal-case font-normal text-gray-400">(optional)</span></label><input value={bannerForm.title} onChange={e => setBannerForm({...bannerForm, title: e.target.value})} placeholder="e.g. Free Shipping" className={inp} /></div>
                        <div><label className={lbl}>Link URL</label><input value={bannerForm.link} onChange={e => setBannerForm({...bannerForm, link: e.target.value})} placeholder="e.g. /seller/register or https://..." className={inp} /></div>
                        <div>
                          <label className={lbl}>Banner Image *</label>
                          <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                            <input type="file" accept="image/*" id="banner-img" className="hidden" onChange={async e => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              setBannerUploading(true)
                              const fd = new FormData()
                              fd.append('image', file)
                              fd.append('key', '02b4c7432d64053cdaebd47e3a9918ab')
                              const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: fd })
                              const json = await res.json()
                              if (json.data?.url) setBannerForm(f => ({ ...f, image: json.data.url }))
                              setBannerUploading(false)
                              e.target.value = ''
                            }} />
                            {bannerForm.image ? (
                              <div className="flex items-center gap-3">
                                <img src={bannerForm.image} alt="" className="w-24 h-16 object-cover rounded-lg border border-gray-200" />
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Image uploaded</p>
                                  <button onClick={() => setBannerForm(f => ({ ...f, image: '' }))} className="text-xs text-red-500 hover:text-red-700 mt-1" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                                </div>
                              </div>
                            ) : (
                              <label htmlFor="banner-img" className="cursor-pointer flex items-center gap-3 py-2">
                                {bannerUploading ? (
                                  <div className="flex items-center gap-2 text-sm text-gray-500"><div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> Uploading...</div>
                                ) : (
                                  <>
                                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 text-lg"></div>
                                    <div><p className="text-sm font-medium text-gray-700">Click to upload image</p><p className="text-xs text-gray-400">Recommended: 16:9 ratio · JPG, PNG</p></div>
                                  </>
                                )}
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={bannerForm.active} onChange={e => setBannerForm({...bannerForm, active: e.target.checked})} className="w-4 h-4" />
                          <span className="text-sm font-medium text-gray-700">Active (visible on login page)</span>
                        </label>
                      </div>

                      {/* Preview */}
                      {bannerForm.image && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Preview</p>
                          <div className="rounded-xl overflow-hidden relative" style={{ aspectRatio: '16/9' }}>
                            <img src={bannerForm.image} alt="" className="w-full h-full object-cover" />
                            {bannerForm.link && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-3 py-1.5">
                                {bannerForm.link}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button onClick={() => {
                          const stored = JSON.parse(localStorage.getItem('mock_banners') || '[]')
                          if (editingBanner) {
                            const updated = stored.map((b: any) => b.id === editingBanner ? { ...b, ...bannerForm } : b)
                            localStorage.setItem('mock_banners', JSON.stringify(updated))
                          } else {
                            const newBanner = { ...bannerForm, id: `b${Date.now()}`, created_at: new Date().toISOString() }
                            localStorage.setItem('mock_banners', JSON.stringify([...stored, newBanner]))
                          }
                          loadSection('banners')
                          setShowBannerForm(false)
                          setEditingBanner(null)
                        }}
                          className="px-6 py-2.5 rounded-lg text-white font-semibold text-sm bg-blue-600 hover:bg-blue-700"
                          style={{ border: 'none', cursor: 'pointer' }}>
                          {editingBanner ? 'Update Banner' : 'Create Banner'}
                        </button>
                        <button onClick={() => { setShowBannerForm(false); setEditingBanner(null) }}
                          className="px-5 py-2.5 rounded-lg text-gray-600 font-semibold text-sm bg-gray-100 hover:bg-gray-200"
                          style={{ border: 'none', cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {/* Banner Grid - Preview of login page */}
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Preview — Login Page (3 columns)</p>
                    <div className="grid grid-cols-3 gap-4">
                      {banners.filter((b: any) => b.active).slice(0, 3).map((b: any) => (
                        <div key={b.id} className="rounded-xl overflow-hidden relative bg-gray-100" style={{ aspectRatio: '16/9' }}>
                          {b.image
                            ? <img src={b.image} alt={b.title} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">{b.title}</div>
                          }
                          {b.link && <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 truncate">{b.link}</div>}
                        </div>
                      ))}
                      {banners.filter((b: any) => b.active).length === 0 && (
                        <div className="col-span-3 text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                          <p className="text-sm text-gray-400">No active banners — add one above</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* All banners list */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">All Banners ({banners.length})</p>
                    <div className="space-y-3">
                      {banners.map((b: any) => (
                        <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                          <div className="w-16 h-12 rounded-lg shrink-0 overflow-hidden" style={{ background: b.bg_color }}>
                            {b.image
                              ? <img src={b.image} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center"><span className="text-xs font-bold" style={{ color: b.text_color }}>{b.title?.[0]}</span></div>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-semibold text-gray-900 text-sm">{b.title}</p>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${b.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{b.active ? 'Active' : 'Inactive'}</span>
                            </div>
                            <p className="text-xs text-gray-400 truncate">{b.subtitle} · {b.description}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => {
                              const stored = JSON.parse(localStorage.getItem('mock_banners') || '[]')
                              localStorage.setItem('mock_banners', JSON.stringify(stored.map((s: any) => s.id === b.id ? { ...s, active: !s.active } : s)))
                              loadSection('banners')
                            }}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${b.active ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                              style={{ border: 'none', cursor: 'pointer' }}>
                              {b.active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button onClick={() => {
                              setBannerForm({ title: b.title, link: b.link, active: b.active, image: b.image || '' })
                              setEditingBanner(b.id)
                              setShowBannerForm(true)
                            }}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                              style={{ border: 'none', cursor: 'pointer' }}>Edit</button>
                            <button onClick={() => {
                              if (!confirm('Delete this banner?')) return
                              const stored = JSON.parse(localStorage.getItem('mock_banners') || '[]')
                              localStorage.setItem('mock_banners', JSON.stringify(stored.filter((s: any) => s.id !== b.id)))
                              loadSection('banners')
                            }}
                              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                              style={{ border: 'none', cursor: 'pointer' }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications */}
              {section === 'notifications' && (
                <div className="max-w-2xl">
                  <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="font-bold text-gray-900 text-lg mb-1">Send Bulk Notification</h2>
                    <p className="text-gray-500 text-sm mb-6">Send announcements to buyers, sellers or all users</p>
                    <div className="space-y-4">
                      <div>
                        <label className={lbl}>Send To</label>
                        <div className="flex gap-2">
                          {([{key:'all',label:'All Users'},{key:'buyers',label:'Buyers Only'},{key:'sellers',label:'Sellers Only'}] as const).map(t => (
                            <button key={t.key} onClick={() => setNotifTarget(t.key)}
                              className={`px-4 py-2 rounded-lg text-sm font-semibold ${notifTarget === t.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                              style={{ border: 'none', cursor: 'pointer' }}>{t.label}</button>
                          ))}
                        </div>
                      </div>
                      <div><label className={lbl}>Title *</label><input value={notifTitle} onChange={e => setNotifTitle(e.target.value)} placeholder="e.g. New Feature Available" className={inp} /></div>
                      <div><label className={lbl}>Message *</label><textarea value={notifBody} onChange={e => setNotifBody(e.target.value)} placeholder="Write your message here..." rows={4} className={`${inp} resize-none`} /></div>
                      {(notifTitle || notifBody) && (
                        <div className="rounded-xl p-4 border border-gray-200 bg-gray-50">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Preview</p>
                          <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-gray-200">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0"><Bell className="h-4 w-4 text-blue-600" /></div>
                            <div><p className="font-semibold text-sm text-gray-900">{notifTitle || 'Title'}</p><p className="text-xs text-gray-500 mt-0.5">{notifBody || 'Message'}</p></div>
                          </div>
                        </div>
                      )}
                      <button onClick={sendBulkNotification} disabled={sending}
                        className="flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        style={{ border: 'none', cursor: 'pointer' }}>
                        <Send className="h-4 w-4" />
                        {sending ? 'Sending...' : `Send to ${notifTarget === 'all' ? 'All Users' : notifTarget === 'buyers' ? 'Buyers' : 'Sellers'}`}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Log */}
              {section === 'activity' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="font-bold text-gray-900 text-lg">Activity Log</h2>
                      <p className="text-sm text-gray-500 mt-0.5">All admin actions tracked here</p>
                    </div>
                    <button onClick={() => {
                      if (!confirm('Clear all activity logs?')) return
                      localStorage.removeItem('mock_activity')
                      setActivityLog([])
                      toast('Activity log cleared')
                    }} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" style={{ border: 'none', cursor: 'pointer' }}>
                      Clear Log
                    </button>
                  </div>

                  {activityLog.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
                      <RefreshCw className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                      <p className="font-semibold text-gray-500">No activity yet</p>
                      <p className="text-sm text-gray-400 mt-1">Actions you take will appear here</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      {activityLog.map((a: any, i: number) => {
                        const actionConfig: Record<string, { label: string; color: string }> = {
                          approved_seller: { label: 'Approved Seller', color: 'bg-green-100 text-green-700' },
                          rejected_seller: { label: 'Rejected Seller', color: 'bg-red-100 text-red-700' },
                          suspended_seller: { label: 'Suspended Seller', color: 'bg-orange-100 text-orange-700' },
                          updated_seller: { label: 'Updated Seller', color: 'bg-blue-100 text-blue-700' },
                          banned_user: { label: 'Banned User', color: 'bg-red-100 text-red-700' },
                          unbanned_user: { label: 'Unbanned User', color: 'bg-green-100 text-green-700' },
                          featured_product: { label: 'Featured Product', color: 'bg-yellow-100 text-yellow-700' },
                          unfeatured_product: { label: 'Unfeatured Product', color: 'bg-gray-100 text-gray-600' },
                          resolved_dispute: { label: 'Resolved Dispute', color: 'bg-purple-100 text-purple-700' },
                          updated_order: { label: 'Updated Order', color: 'bg-blue-100 text-blue-700' },
                          sent_notification: { label: 'Sent Notification', color: 'bg-indigo-100 text-indigo-700' },
                          payout_processed: { label: 'Payout Processed', color: 'bg-green-100 text-green-700' },
                        }
                        const cfg = actionConfig[a.action] || { label: a.action, color: 'bg-gray-100 text-gray-600' }
                        return (
                          <div key={a.id} className={`flex items-start gap-4 px-5 py-4 ${i < activityLog.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-gray-50 transition-colors`}>
                            <div className="relative shrink-0 mt-0.5">
                              <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5" />
                              {i < activityLog.length - 1 && <div className="absolute top-3 left-0.5 w-px bg-gray-200" style={{ height: 'calc(100% + 16px)' }} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                                <span className="text-sm font-semibold text-gray-900">{a.target}</span>
                              </div>
                              <p className="text-xs text-gray-500">{a.details}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs text-gray-400">{new Date(a.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                              <p className="text-xs text-gray-400">{new Date(a.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

            </>
          )}
        </main>
      </div>

      {/* Suspend Modal */}
      {suspendModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-1">Suspend Seller</h3>
            <p className="text-gray-500 text-sm mb-2">Suspending <strong>{suspendModal.name}</strong></p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-5 text-sm text-yellow-800">Seller will be notified with a 40-day deadline to resubmit.</div>
            <textarea value={suspendReason} onChange={e => setSuspendReason(e.target.value)} placeholder="Reason for suspension..." rows={4} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-400 resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={suspendSeller} className="flex-1 py-2.5 rounded-lg text-white font-semibold text-sm bg-red-600 hover:bg-red-700" style={{ border: 'none', cursor: 'pointer' }}>Suspend & Notify</button>
              <button onClick={() => { setSuspendModal(null); setSuspendReason('') }} className="px-5 py-2.5 rounded-lg text-gray-600 font-semibold text-sm bg-gray-100 hover:bg-gray-200" style={{ border: 'none', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-1">Reject Application</h3>
            <p className="text-gray-500 text-sm mb-5">Rejecting <strong>{rejectModal.name}</strong>. Please provide a reason.</p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection..." rows={4} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-400 resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={rejectWithReason} className="flex-1 py-2.5 rounded-lg text-white font-semibold text-sm bg-red-600 hover:bg-red-700" style={{ border: 'none', cursor: 'pointer' }}>Confirm Reject</button>
              <button onClick={() => { setRejectModal(null); setRejectReason('') }} className="px-5 py-2.5 rounded-lg text-gray-600 font-semibold text-sm bg-gray-100 hover:bg-gray-200" style={{ border: 'none', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <p className="font-bold text-gray-900">Order #{selectedOrder.id.slice(0,8)}</p>
                <p className="text-xs text-gray-400">{new Date(selectedOrder.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[selectedOrder.status] || 'bg-gray-100 text-gray-600'}`}>{selectedOrder.status}</span>
                <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Customer', selectedOrder.users?.full_name],
                  ['Email', selectedOrder.users?.email],
                  ['Product', selectedOrder.product_name || '—'],
                  ['Quantity', String(selectedOrder.quantity || 1)],
                  ['Total', `₹${selectedOrder.total_amount?.toLocaleString('en-IN')}`],
                  ['Courier', selectedOrder.courier || 'Not assigned'],
                  ['Tracking No.', selectedOrder.tracking_number || 'Not available'],
                  ['Address', selectedOrder.shipping_address || '—'],
                ].map(([l, v]: any, i: number) => (
                  <div key={i} className={`bg-gray-50 rounded-lg p-3 ${i === 7 ? 'col-span-2' : ''}`}>
                    <p className="text-xs text-gray-400 mb-0.5">{l}</p>
                    <p className="text-sm font-semibold text-gray-900">{v}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Tracking History</p>
                <div className="relative">
                  {(selectedOrder.tracking_history || []).map((t: any, i: number, arr: any[]) => (
                    <div key={i} className="flex gap-3 mb-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full shrink-0 mt-0.5 ${i === arr.length-1 ? 'bg-blue-600' : 'bg-green-500'}`} />
                        {i < arr.length-1 && <div className="w-0.5 bg-gray-200 flex-1 mt-1" style={{minHeight:20}} />}
                      </div>
                      <div className="pb-3">
                        <p className="text-sm font-semibold text-gray-900">{t.status}</p>
                        <p className="text-xs text-gray-400">{t.location} · {new Date(t.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})} {new Date(t.date).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Update Status</p>
                <div className="flex gap-2 flex-wrap">
                  {['pending','confirmed','processed','shipped','delivered','cancelled'].map(s => (
                    <button key={s} onClick={() => { updateOrderStatus(selectedOrder.id, s); setSelectedOrder({...selectedOrder, status: s}) }}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg capitalize ${selectedOrder.status === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      style={{ border: 'none', cursor: 'pointer' }}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">{selectedUser.full_name?.[0]}</div>
                <div>
                  <p className="font-bold text-gray-900">{selectedUser.full_name}</p>
                  <p className="text-xs text-gray-400">{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {[['Full Name',selectedUser.full_name],['Email',selectedUser.email],['Phone',selectedUser.phone||'—'],['Role',selectedUser.role],['Joined',new Date(selectedUser.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})],['Status',selectedUser.is_banned?'Banned':'Active']].map(([l,v],i)=>(
                  <div key={i} className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-400 mb-0.5">{l}</p><p className="text-sm font-semibold text-gray-900">{v}</p></div>
                ))}
              </div>
              {(() => {
                const userOrders = JSON.parse(localStorage.getItem('mock_orders')||'[]').filter((o:any)=>o.user_id===selectedUser.id)
                const totalSpent = userOrders.reduce((acc:number,o:any)=>acc+(o.total_amount||0),0)
                return (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-blue-700">{userOrders.length}</p><p className="text-xs text-blue-500 mt-0.5">Total Orders</p></div>
                      <div className="bg-green-50 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-green-700">₹{totalSpent.toLocaleString('en-IN')}</p><p className="text-xs text-green-500 mt-0.5">Total Spent</p></div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Order History</p>
                      {userOrders.length === 0 ? <div className="text-center py-8 rounded-xl bg-gray-50 border border-gray-200"><p className="text-sm text-gray-400">No orders yet</p></div> : (
                        <div className="space-y-2">
                          {userOrders.map((o:any)=>(
                            <div key={o.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-200">
                              <div><p className="text-xs font-mono text-gray-400">#{o.id.slice(0,8)}</p><p className="text-sm font-semibold text-gray-900">₹{o.total_amount?.toLocaleString('en-IN')}</p><p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('en-IN')}</p></div>
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[o.status]||'bg-gray-100 text-gray-600'}`}>{o.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )
              })()}
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button onClick={() => { banUser(selectedUser.id, !selectedUser.is_banned); setSelectedUser(null) }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold text-white ${selectedUser.is_banned ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                  style={{ border: 'none', cursor: 'pointer' }}>{selectedUser.is_banned ? 'Unban User' : 'Ban User'}</button>
                <button onClick={() => setSelectedUser(null)} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200" style={{ border: 'none', cursor: 'pointer' }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seller Detail Modal */}
      {selectedSeller && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedSeller(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-500">{selectedSeller.shop_name?.[0]}</div>
                <div><p className="font-bold text-gray-900">{selectedSeller.shop_name}</p><p className="text-xs text-gray-400">@{selectedSeller.shop_username}</p></div>
              </div>
              <div className="flex items-center gap-2">
                {selectedSeller.status === 'active' && (
                  <button onClick={() => { setSelectedSeller(null); setSuspendModal({ id: selectedSeller.id, name: selectedSeller.shop_name, userId: selectedSeller.user_id }) }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100" style={{ border: 'none', cursor: 'pointer' }}>Suspend</button>
                )}
                {selectedSeller.status === 'suspended' && (
                  <button onClick={() => { updateSellerStatus(selectedSeller.id, 'active'); setSelectedSeller(null) }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100" style={{ border: 'none', cursor: 'pointer' }}>Reactivate</button>
                )}
                <button onClick={() => setSelectedSeller(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Shop Information</p>
                <div className="grid grid-cols-2 gap-3">
                  {[['Shop Name',selectedSeller.shop_name],['Username',`@${selectedSeller.shop_username}`],['Email',selectedSeller.shop_email],['Phone',selectedSeller.shop_phone],['Type',selectedSeller.product_condition==='new'?'New':selectedSeller.product_condition==='used'?'Used':'Both'],['Status',selectedSeller.status],['Joined',new Date(selectedSeller.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})]].filter(([,v])=>v).map(([l,v],i)=>(
                    <div key={i} className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-400 mb-0.5">{l}</p><p className="text-sm font-semibold text-gray-900">{v}</p></div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Owner Details</p>
                <div className="grid grid-cols-2 gap-3">
                  {[['Full Name',selectedSeller.users?.full_name],['Email',selectedSeller.users?.email||selectedSeller.owner_email],['Phone',selectedSeller.owner_phone],['Date of Birth',selectedSeller.dob]].filter(([,v])=>v).map(([l,v],i)=>(
                    <div key={i} className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-400 mb-0.5">{l}</p><p className="text-sm font-semibold text-gray-900">{v}</p></div>
                  ))}
                </div>
              </div>
              {selectedSeller.account_number && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Bank Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[['Account Number',selectedSeller.account_number],['IFSC Code',selectedSeller.ifsc_code],['Account Type',selectedSeller.account_type],['Pay To',selectedSeller.pay_to_name]].filter(([,v])=>v).map(([l,v],i)=>(
                      <div key={i} className="bg-yellow-50 rounded-lg p-3 border border-yellow-100"><p className="text-xs text-yellow-600 mb-0.5">{l}</p><p className="text-sm font-semibold font-mono text-gray-900">{v}</p></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}