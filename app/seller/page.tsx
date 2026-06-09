import Link from "next/link"
import Image from "next/image"
import { ChevronRight } from "lucide-react"

export default function SellerPortalPage() {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">

      {/* Background Image */}
      <Image
        src="/images/bg.png"
        alt="Background"
        fill
        className="object-cover"
        priority
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-[750px] bg-white shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[480px]">

        {/* Left Panel — Blue */}
        <div className="bg-[#2874f0] text-white p-10 md:w-[40%] flex flex-col justify-between">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-white font-bold text-lg tracking-tight">PARTLY</span>
            </div>

            <h1 className="text-[26px] font-bold mb-4 leading-tight">
              Seller Portal
            </h1>
            <p className="text-[15px] leading-relaxed text-white/85">
              Login to your seller account or start your selling journey with us today
            </p>
          </div>

          {/* Illustration */}
          <div className="mt-auto flex justify-center pb-2">
            <div className="relative w-[200px] h-[140px]">
              {/* Cloud with sun */}
              <div className="absolute top-0 right-8">
                <div className="w-12 h-8 bg-[#4285f4]/60 rounded-full relative">
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full" />
                </div>
              </div>
              {/* Laptop */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
                <div className="w-28 h-20 bg-[#5c9eff] rounded-t-lg border-4 border-[#4a8be8] flex items-center justify-center">
                  <div className="w-10 h-10 bg-[#4285f4] rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                </div>
                <div className="w-32 h-2 bg-[#4a8be8] rounded-b-sm mx-auto" />
              </div>
              {/* Shopping bag */}
              <div className="absolute bottom-2 left-2">
                <div className="w-8 h-10 bg-red-400 rounded-sm relative">
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
                  <svg className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
              </div>
              {/* Yellow note */}
              <div className="absolute bottom-4 right-4 w-6 h-8 bg-yellow-300 rounded-sm transform rotate-12" />
            </div>
          </div>
        </div>

        {/* Right Panel — White */}
        <div className="p-10 md:w-[60%] flex flex-col justify-center">
          <div className="space-y-4">

            {/* Login Card */}
            <Link href="/seller/login" className="block w-full">
              <div className="border border-slate-200 rounded-sm p-5 hover:bg-slate-50 hover:border-[#2874f0]/40 transition-all duration-200 cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[16px] font-semibold text-slate-800 mb-1">Login</h2>
                    <p className="text-slate-500 text-sm">
                      Already have a seller account? Sign in
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#2874f0] transition-colors" />
                </div>
              </div>
            </Link>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-slate-400 text-xs font-medium">OR</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Register Card */}
            <Link href="/register" className="block w-full">
              <div className="border border-slate-200 rounded-sm p-5 hover:bg-slate-50 hover:border-[#2874f0]/40 transition-all duration-200 cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[16px] font-semibold text-slate-800 mb-1">Start Selling</h2>
                    <p className="text-slate-500 text-sm">
                      New to selling? Register and grow your business
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#2874f0] transition-colors" />
                </div>
              </div>
            </Link>

            {/* Individual Seller */}
            <Link href="/individual-seller" className="block w-full">
              <div className="border border-slate-200 rounded-sm p-5 hover:bg-slate-50 hover:border-[#2874f0]/40 transition-all duration-200 cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[16px] font-semibold text-slate-800 mb-1">Individual Seller</h2>
                    <p className="text-slate-500 text-sm">
                      Have 1-3 parts to sell? List them without a shop
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#2874f0] transition-colors" />
                </div>
              </div>
            </Link>

{/* Terms */}
            <p className="text-slate-400 text-xs text-center pt-2">
              By continuing, you agree to our{" "}
              <Link href="/terms" className="text-[#2874f0] hover:underline">
                Terms of Use
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-[#2874f0] hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}