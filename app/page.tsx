import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import PostList from '@/components/PostList'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Navbar />
      <main>
        <HeroSection />
        <PostList />
      </main>
      <Footer />
    </div>
  )
}
