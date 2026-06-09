"use client"

import { Mail, ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <footer className="bg-gray-100 border-t border-gray-200">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Top Section */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 leading-tight mb-6">
              Stay in the loop with
              <br />
              our latest listings
            </h2>
            <Button variant="outline" className="rounded-full px-6 gap-2">
              Subscribe
              <Mail className="w-4 h-4" />
            </Button>
          </div>
          <button
            onClick={scrollToTop}
            className="text-sm text-gray-900 hover:text-blue-600 transition-colors flex items-center gap-1"
          >
            Back To Top
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Section - Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* About */}
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">Partly</h3>
            <div className="text-sm text-gray-500 space-y-1">
              <p>India's auto parts marketplace</p>
              <p>Kerala-first launch</p>
              <p>support@partly.in</p>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">Contact</h3>
            <div className="text-sm text-gray-500 space-y-1">
              <p>Kozhikode, Kerala</p>
              <p>India – 673 001</p>
              <a href="mailto:support@partly.in" className="block hover:text-gray-900 transition-colors">support@partly.in</a>
            </div>
          </div>

          {/* Quick Links */}
<div className="space-y-2">
  <h3 className="font-medium text-gray-900">Quick Links</h3>
  <div className="text-sm text-gray-500 space-y-1">
    <a href="/" className="block hover:text-gray-900 transition-colors">Browse Parts</a>
    <a href="/requests" className="block hover:text-gray-900 transition-colors">Part Requests</a>
    <a href="/seller" className="block hover:text-gray-900 transition-colors">Seller Registration</a>
    <a href="/terms" className="block hover:text-gray-900 transition-colors">Terms & Conditions</a>
    <a href="/terms" className="block hover:text-gray-900 transition-colors">Privacy Policy</a>
    <a href="/terms" className="block hover:text-gray-900 transition-colors">Refund Policy</a>
  </div>
</div>

          {/* Social */}
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">Connect</h3>
            <div className="text-sm text-gray-500 space-y-1">
              <a href="#" className="block hover:text-gray-900 transition-colors">Instagram</a>
              <a href="#" className="block hover:text-gray-900 transition-colors">WhatsApp</a>
              <a href="#" className="block hover:text-gray-900 transition-colors">YouTube</a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-500">
          <p>All Rights Reserved - Copyright © 2026 PARTLY</p>
          <div className="flex items-center gap-4">
            <a href="/terms" className="hover:text-gray-900 transition-colors">Terms & Conditions</a>
            <a href="/terms" className="hover:text-gray-900 transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-gray-900 transition-colors">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  )
}