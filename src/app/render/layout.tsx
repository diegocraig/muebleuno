import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Render · Cocinas',
  robots: { index: false, follow: false, nocache: true },
}

// Módulo en pruebas: sin links desde el sitio y solo para el admin del panel.
export default async function RenderLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession()
  if (!s || s.rol !== 'admin') redirect('/admin/login?next=/render')
  return children
}
