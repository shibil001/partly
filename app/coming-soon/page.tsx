"use client"
import Link from "next/link"
import { Clock, ArrowLeft } from "lucide-react"

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Auctions Coming Soon</h1>
        <p className="text-gray-500 text-base mb-8 leading-relaxed">
          We are working on something exciting. Partly Auctions will let you bid on cars in real time.
        </p>
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Partly
        </Link>
      </div>
    </div>
  )
}
