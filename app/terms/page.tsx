"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import Link from "next/link"

type Tab = "terms" | "privacy" | "refund" | "shipping"

export default function TermsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("terms")

  const tabs: { id: Tab; label: string }[] = [
    { id: "terms", label: "Terms & Conditions" },
    { id: "privacy", label: "Privacy Policy" },
    { id: "refund", label: "Refund & Cancellation" },
    { id: "shipping", label: "Shipping & Delivery" },
  ]

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Legal Policies</h1>
            <p className="text-gray-500 mt-2">Last updated: June 2026 · Partly Marketplace</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mb-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-8 text-gray-700 leading-relaxed">

            {/* ─── TERMS & CONDITIONS ─── */}
            {activeTab === "terms" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Terms & Conditions</h2>
                  <p className="text-sm text-gray-500">Effective Date: 1 June 2026</p>
                </div>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">1. About Partly</h3>
                  <p>Partly ("we", "our", "the Platform") is an online marketplace operated by Partly Technologies (India), connecting buyers and verified sellers of automobile parts, accessories, and related products across India. The Platform is accessible at <strong>partly.in</strong>.</p>
                  <p className="mt-2">By accessing or using Partly, you agree to be bound by these Terms & Conditions. If you do not agree, please discontinue use immediately.</p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Eligibility</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>You must be at least 18 years of age to use Partly.</li>
                    <li>You must be a resident of India with a valid Indian phone number and email address.</li>
                    <li>Sellers must complete KYC verification and receive approval from Partly before listing products.</li>
                    <li>By using this Platform, you represent and warrant that you meet all eligibility requirements.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">3. User Accounts</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                    <li>You must notify us immediately of any unauthorised use of your account.</li>
                    <li>Partly reserves the right to suspend or terminate accounts that violate these Terms.</li>
                    <li>One person may not maintain more than one buyer account or more than one seller account.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Buying on Partly</h3>
                  <p className="text-sm">When you place an order on Partly:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                    <li>You enter into a contract of sale directly with the seller, not with Partly.</li>
                    <li>Partly acts as an intermediary platform and payment facilitator.</li>
                    <li>You must verify fitment compatibility before purchasing. Part descriptions are provided by sellers.</li>
                    <li>Prices are inclusive of applicable taxes unless stated otherwise.</li>
                    <li>Orders are confirmed only after successful payment processing.</li>
                    <li>Partly holds payment for 14 days post-delivery before releasing to sellers, to protect buyers.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Selling on Partly</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Sellers must list only genuine, accurately described products that they own or are authorised to sell.</li>
                    <li>Counterfeit, stolen, or prohibited goods are strictly forbidden.</li>
                    <li>Sellers must fulfil orders within the committed dispatch time.</li>
                    <li>Partly charges a commission on each sale as per the tiered structure disclosed in the Seller Agreement.</li>
                    <li>Payouts are processed weekly every Monday, net of Partly's commission and any disputed amounts.</li>
                    <li>Sellers are responsible for accurate GST invoicing where applicable.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Prohibited Activities</h3>
                  <p className="text-sm">You may not:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                    <li>List or sell counterfeit, stolen, or prohibited automobile parts.</li>
                    <li>Engage in price manipulation, shill bidding, or fake reviews.</li>
                    <li>Circumvent Partly's payment system by transacting off-platform.</li>
                    <li>Harass, threaten, or defraud other users.</li>
                    <li>Use automated bots, scrapers, or other tools to access the Platform without permission.</li>
                    <li>Impersonate another person or entity.</li>
                    <li>Upload malicious code or attempt to compromise Platform security.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">7. Intellectual Property</h3>
                  <p className="text-sm">All content on Partly — including logos, design, code, and text — is the property of Partly Technologies (India) and is protected under Indian copyright law. Sellers grant Partly a non-exclusive licence to display their product images and descriptions on the Platform.</p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">8. Limitation of Liability</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Partly is a marketplace platform and is not the seller of record. Sellers are independently responsible for their products.</li>
                    <li>Partly's maximum liability to any user shall not exceed the value of the transaction in dispute.</li>
                    <li>Partly is not liable for indirect, incidental, or consequential damages.</li>
                    <li>Partly does not guarantee uninterrupted or error-free service.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">9. Dispute Resolution</h3>
                  <p className="text-sm">Any disputes between buyers and sellers are handled through Partly's Dispute Resolution System:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                    <li>Buyer raises a return or dispute within 7 days of delivery.</li>
                    <li>Seller has 3 days to respond. No response = decision goes in buyer's favour.</li>
                    <li>Partly's admin team reviews evidence from both sides and issues a binding decision.</li>
                    <li>Disputed amounts are withheld from seller payouts pending resolution.</li>
                    <li>For unresolved matters, disputes shall be subject to the jurisdiction of courts in Kozhikode, Kerala, India.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">10. Governing Law</h3>
                  <p className="text-sm">These Terms are governed by the laws of India, including the Information Technology Act 2000, Consumer Protection Act 2019, and applicable GST legislation. The courts of Kozhikode, Kerala shall have exclusive jurisdiction.</p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">11. Amendments</h3>
                  <p className="text-sm">Partly reserves the right to amend these Terms at any time. Continued use of the Platform after notification of changes constitutes acceptance of the revised Terms.</p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">12. Contact</h3>
                  <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
                    <p><strong>Partly Technologies (India)</strong></p>
                    <p>Kozhikode, Kerala, India – 673 001</p>
                    <p>Email: <a href="mailto:support@partly.in" className="text-blue-600">support@partly.in</a></p>
                    <p>Phone: +91 XXXXX XXXXX</p>
                    <p>Grievance Officer: [Name] · <a href="mailto:grievance@partly.in" className="text-blue-600">grievance@partly.in</a></p>
                  </div>
                </section>
              </div>
            )}

            {/* ─── PRIVACY POLICY ─── */}
            {activeTab === "privacy" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Privacy Policy</h2>
                  <p className="text-sm text-gray-500">Effective Date: 1 June 2026 · Compliant with IT Act 2000 & DPDP Act 2023</p>
                </div>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Information We Collect</h3>
                  <p className="text-sm font-medium text-gray-800 mb-2">Personal Information:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Name, email address, phone number, and profile photo.</li>
                    <li>Shipping and billing address.</li>
                    <li>Government-issued ID for seller KYC verification (Aadhaar, PAN, GST).</li>
                    <li>Bank account details for seller payouts (stored encrypted).</li>
                  </ul>
                  <p className="text-sm font-medium text-gray-800 mb-2 mt-4">Transactional Data:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Order history, payment records, and communications.</li>
                    <li>Dispute and return records.</li>
                  </ul>
                  <p className="text-sm font-medium text-gray-800 mb-2 mt-4">Usage Data:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Pages visited, search queries, device and browser information.</li>
                    <li>IP address and approximate location (state/city level).</li>
                    <li>Cookies and session identifiers.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">2. How We Use Your Information</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>To process orders, payments, and payouts.</li>
                    <li>To verify seller identity and prevent fraud.</li>
                    <li>To provide customer support and resolve disputes.</li>
                    <li>To send transactional notifications (order updates, offers).</li>
                    <li>To improve Platform features and personalise your experience.</li>
                    <li>To comply with legal obligations under Indian law.</li>
                    <li>To send promotional communications (with your consent — you may opt out anytime).</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Information Sharing</h3>
                  <p className="text-sm">We do not sell your personal data. We share information only with:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                    <li><strong>Sellers:</strong> Your name and shipping address when you place an order.</li>
                    <li><strong>Razorpay:</strong> Payment details for processing transactions. Subject to Razorpay's privacy policy.</li>
                    <li><strong>Logistics Partners:</strong> Name, address, and phone number for order delivery.</li>
                    <li><strong>ImgBB:</strong> Product and profile images are hosted on ImgBB.</li>
                    <li><strong>Law Enforcement:</strong> When required by Indian law or court order.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Data Security</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>All data is transmitted over HTTPS (TLS encryption).</li>
                    <li>Bank details are stored with AES-256 encryption.</li>
                    <li>Passwords are managed by Supabase Auth (bcrypt hashed — we never see plaintext passwords).</li>
                    <li>Access to user data is restricted to authorised personnel only.</li>
                    <li>We conduct regular security reviews and vulnerability assessments.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Data Retention</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Account data is retained for the duration of your account and 3 years after deletion (for legal compliance).</li>
                    <li>Transaction records are retained for 7 years as required by Indian tax law.</li>
                    <li>You may request deletion of your personal data at any time (subject to legal retention requirements).</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Your Rights (DPDP Act 2023)</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Right to Access:</strong> Request a copy of the personal data we hold about you.</li>
                    <li><strong>Right to Correction:</strong> Request correction of inaccurate data.</li>
                    <li><strong>Right to Erasure:</strong> Request deletion of your data (subject to legal obligations).</li>
                    <li><strong>Right to Grievance Redressal:</strong> Contact our Grievance Officer for data-related complaints.</li>
                    <li><strong>Right to Withdraw Consent:</strong> Opt out of marketing communications at any time.</li>
                  </ul>
                  <p className="text-sm mt-2">To exercise your rights, email <a href="mailto:privacy@partly.in" className="text-blue-600">privacy@partly.in</a>.</p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">7. Cookies</h3>
                  <p className="text-sm">We use essential cookies for session management and authentication. We may use analytics cookies to understand usage patterns. You can disable cookies in your browser settings, though this may affect Platform functionality.</p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">8. Third-Party Links</h3>
                  <p className="text-sm">The Platform may contain links to third-party websites. We are not responsible for their privacy practices and encourage you to review their policies.</p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">9. Grievance Officer</h3>
                  <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
                    <p><strong>Name:</strong> [Grievance Officer Name]</p>
                    <p><strong>Designation:</strong> Grievance Officer</p>
                    <p><strong>Email:</strong> <a href="mailto:grievance@partly.in" className="text-blue-600">grievance@partly.in</a></p>
                    <p><strong>Address:</strong> Partly Technologies (India), Kozhikode, Kerala – 673 001</p>
                    <p className="text-gray-500 mt-1">Response time: Within 72 hours of receipt.</p>
                  </div>
                </section>
              </div>
            )}

            {/* ─── REFUND & CANCELLATION ─── */}
            {activeTab === "refund" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Refund & Cancellation Policy</h2>
                  <p className="text-sm text-gray-500">Effective Date: 1 June 2026</p>
                </div>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Order Cancellation</h3>
                  <div className="space-y-3 text-sm">
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="font-medium text-blue-900 mb-1">By Buyer — Before Dispatch</p>
                      <p className="text-blue-800">You may cancel your order at no charge before the seller marks it as dispatched. Full refund processed within 5–7 working days.</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4">
                      <p className="font-medium text-amber-900 mb-1">By Buyer — After Dispatch</p>
                      <p className="text-amber-800">Cancellation after dispatch is not permitted. You must wait for delivery and then raise a return request.</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="font-medium text-gray-900 mb-1">By Seller</p>
                      <p className="text-gray-700">If a seller cancels an order, the buyer receives a full refund within 5–7 working days. Repeated seller cancellations may result in account suspension.</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Returns</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>Return requests must be raised within <strong>7 days of delivery</strong>.</li>
                    <li>The part must be unused, in original packaging, and in the same condition as received.</li>
                    <li>Returns are accepted for: wrong part delivered, damaged/defective part, part not as described.</li>
                    <li>Returns are <strong>not accepted</strong> for: buyer ordered incorrect fitment, part used or installed, original packaging damaged by buyer.</li>
                    <li>To raise a return, go to My Orders → Select Order → Raise Return Request.</li>
                    <li>Seller has 3 days to accept or reject the return. If no response, return is auto-approved.</li>
                    <li>Buyer must ship the part back to the seller at the seller's cost (for valid returns).</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Refunds</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left p-3 border border-gray-200 font-medium">Scenario</th>
                          <th className="text-left p-3 border border-gray-200 font-medium">Refund Amount</th>
                          <th className="text-left p-3 border border-gray-200 font-medium">Timeline</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ["Order cancelled before dispatch", "100% of order value", "5–7 working days"],
                          ["Order cancelled by seller", "100% of order value", "5–7 working days"],
                          ["Wrong part delivered", "100% + return shipping", "7–10 working days after part received"],
                          ["Damaged/defective part", "100% of order value", "7–10 working days after verification"],
                          ["Part not as described", "100% of order value", "7–10 working days after verification"],
                          ["Payment failure (amount debited)", "100% of order value", "3–5 working days"],
                        ].map(([scenario, amount, timeline]) => (
                          <tr key={scenario}>
                            <td className="p-3 border border-gray-200">{scenario}</td>
                            <td className="p-3 border border-gray-200 text-green-700 font-medium">{amount}</td>
                            <td className="p-3 border border-gray-200 text-gray-500">{timeline}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">Refunds are credited to the original payment source (UPI, bank account, or card). Platform credits are not offered.</p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Disputes</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>If a seller rejects your return, you may escalate to a Partly dispute within 2 days.</li>
                    <li>Partly's team reviews evidence (photos, messages, tracking) from both parties.</li>
                    <li>Partly's decision is final and binding on both parties.</li>
                    <li>Disputed amounts are held until resolution.</li>
                    <li>Contact: <a href="mailto:disputes@partly.in" className="text-blue-600">disputes@partly.in</a></li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Non-Refundable Items</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Parts that have been installed or used.</li>
                    <li>Consumables (oils, fluids, filters) once opened.</li>
                    <li>Electrical components once powered or tested (unless DOA).</li>
                    <li>Custom or specially ordered parts.</li>
                    <li>Parts damaged due to incorrect installation by buyer.</li>
                  </ul>
                </section>

                <section className="bg-blue-50 rounded-xl p-5">
                  <h3 className="text-base font-semibold text-blue-900 mb-2">Need Help?</h3>
                  <p className="text-sm text-blue-800">For refund or return queries, contact us at <a href="mailto:support@partly.in" className="font-medium underline">support@partly.in</a> or through the Help section in your account. We respond within 24 hours on working days.</p>
                </section>
              </div>
            )}

            {/* ─── SHIPPING & DELIVERY ─── */}
            {activeTab === "shipping" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Shipping & Delivery Policy</h2>
                  <p className="text-sm text-gray-500">Effective Date: 1 June 2026</p>
                </div>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Shipping Overview</h3>
                  <p className="text-sm">Partly is a marketplace platform. Products are shipped directly from individual sellers to buyers. Partly facilitates the transaction and tracks delivery status but does not directly handle shipments.</p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Delivery Timelines</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left p-3 border border-gray-200 font-medium">Delivery Type</th>
                          <th className="text-left p-3 border border-gray-200 font-medium">Estimated Time</th>
                          <th className="text-left p-3 border border-gray-200 font-medium">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ["Standard Delivery", "5–7 working days", "Most orders across India"],
                          ["Express Delivery", "2–3 working days", "Available on select products"],
                          ["Local Pickup", "Same day / as agreed", "Where seller offers pickup"],
                          ["Kerala (Local)", "2–4 working days", "Faster for Kerala-based sellers"],
                          ["Remote Areas", "7–12 working days", "Northeast India, Andaman, J&K"],
                        ].map(([type, time, notes]) => (
                          <tr key={type}>
                            <td className="p-3 border border-gray-200 font-medium">{type}</td>
                            <td className="p-3 border border-gray-200 text-blue-700">{time}</td>
                            <td className="p-3 border border-gray-200 text-gray-500">{notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">Timelines are estimates and may vary due to public holidays, strikes, weather, or courier delays. These timelines count from order confirmation, not payment date.</p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Shipping Charges</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Shipping charges are set by individual sellers and displayed at checkout.</li>
                    <li>Some sellers offer free shipping — this is indicated on the product listing.</li>
                    <li>Shipping charges are non-refundable except in cases of seller error or damaged goods.</li>
                    <li>Partly does not add any additional shipping surcharges.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Order Tracking</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Once dispatched, sellers upload a tracking number and courier name on Partly.</li>
                    <li>You will receive an SMS/notification with tracking details.</li>
                    <li>Track your order from My Orders → Select Order → Track Shipment.</li>
                    <li>If tracking is not updated within 3 days of dispatch, contact the seller via Messages.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Delivery Issues</h3>
                  <div className="space-y-3 text-sm">
                    <div className="border border-gray-200 rounded-xl p-4">
                      <p className="font-medium text-gray-900 mb-1">Package Not Delivered</p>
                      <p className="text-gray-600">If your package shows as delivered but you haven't received it, contact us within 48 hours at <a href="mailto:support@partly.in" className="text-blue-600">support@partly.in</a>. We will investigate with the courier.</p>
                    </div>
                    <div className="border border-gray-200 rounded-xl p-4">
                      <p className="font-medium text-gray-900 mb-1">Damaged Package on Delivery</p>
                      <p className="text-gray-600">Take photos of the damaged packaging before opening. Do not accept a damaged package without noting it with the courier. Raise a return/dispute on Partly within 24 hours.</p>
                    </div>
                    <div className="border border-gray-200 rounded-xl p-4">
                      <p className="font-medium text-gray-900 mb-1">Delayed Delivery</p>
                      <p className="text-gray-600">If your order is significantly delayed beyond the estimated timeline, contact the seller first. If unresolved, raise a complaint via <a href="mailto:support@partly.in" className="text-blue-600">support@partly.in</a>.</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Seller Dispatch Commitment</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Sellers must dispatch orders within 2 working days of confirmation.</li>
                    <li>Sellers must upload valid tracking information within 24 hours of dispatch.</li>
                    <li>Failure to dispatch on time may result in automatic order cancellation and full buyer refund.</li>
                    <li>Repeat dispatch delays may result in seller account suspension.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">7. International Shipping</h3>
                  <p className="text-sm">Partly currently operates within India only. International shipping is not supported at this time.</p>
                </section>

                <section className="bg-blue-50 rounded-xl p-5">
                  <h3 className="text-base font-semibold text-blue-900 mb-2">Shipping Support</h3>
                  <p className="text-sm text-blue-800">For shipping queries, reach us at <a href="mailto:support@partly.in" className="font-medium underline">support@partly.in</a>. Include your Order ID for faster resolution.</p>
                </section>
              </div>
            )}

          </div>

          {/* Footer links */}
          <div className="mt-8 flex flex-wrap gap-4 text-sm text-gray-500">
            <span>© 2026 Partly Technologies (India)</span>
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <a href="mailto:support@partly.in" className="hover:text-blue-600">Contact Us</a>
          </div>
        </div>
      </div>
    </>
  )
}