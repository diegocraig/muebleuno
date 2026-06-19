import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ pedido?: string }>
}

// Ruta legacy: el callback de Nave ahora apunta a /estado-pago. Mantenemos esta
// redirección por si algún pago en vuelo tiene guardado el callback_url viejo.
export default async function PagoExitosoRedirect({ searchParams }: PageProps) {
  const { pedido } = await searchParams
  redirect(pedido ? `/estado-pago?pedido=${pedido}` : '/estado-pago')
}
