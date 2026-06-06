import type { Metadata } from 'next'
import { Barlow } from 'next/font/google'
import './globals.css'

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-barlow',
})

export const metadata: Metadata = {
  title: 'Mueble UNO — Mueblería en El Palomar, Buenos Aires',
  description: 'Muebles de calidad con envíos a todo el país. Cuotas sin interés.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${barlow.variable} font-barlow antialiased`}>
        {children}
      </body>
    </html>
  )
}
