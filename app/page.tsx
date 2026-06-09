import { Header } from "@/components/header"
import { HeroSearch } from "@/components/hero-search"
import { FeaturedProducts } from "@/components/featured-products"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroSearch />
        <FeaturedProducts />
      </main>
      <Footer />
    </div>
  )
}