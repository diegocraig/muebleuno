import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import WhatsAppButton from '@/components/public/WhatsAppButton'
import CartProvider from '@/components/public/CartProvider'
import ProveedoresBar from '@/components/public/ProveedoresBar'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">{children}</main>
        <div className="border-t border-gray-100">
          <ProveedoresBar />
        </div>
        <Footer />
        <WhatsAppButton />
      </div>
    </CartProvider>
  )
}
