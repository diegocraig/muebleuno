import type { Metadata } from 'next'
import { Barlow } from 'next/font/google'
import './globals.css'
import { SITE_URL, SITE_NAME, BASE_PATH } from '@/lib/seo'

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-barlow',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Mueblería en El Palomar, Buenos Aires`,
    template: `%s — ${SITE_NAME}`,
  },
  description: 'Fábrica de muebles en El Palomar, Buenos Aires. Calidad premium, precio de fábrica. Envíos a todo el país. Cuotas sin interés.',
  openGraph: {
    siteName: SITE_NAME,
    locale: 'es_AR',
    type: 'website',
    url: `${SITE_URL}${BASE_PATH}`,
    images: [{ url: `${BASE_PATH}/logo.png`, width: 160, height: 34, alt: SITE_NAME }],
  },
  robots: { index: true, follow: true },
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
