'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Re-consulta el estado del pedido cada `intervalMs` mientras el pago sigue
// "pendiente": el webhook de Nave (server-to-server) puede llegar unos segundos
// después de que el navegador vuelve al callback, así que refrescamos hasta que
// el estado cambie. Se detiene solo tras `maxTries` para no refrescar infinito.
export default function AutoRefresh({
  intervalMs = 5000,
  maxTries = 12,
}: {
  intervalMs?: number
  maxTries?: number
}) {
  const router = useRouter()

  useEffect(() => {
    let tries = 0
    const t = setInterval(() => {
      tries += 1
      if (tries > maxTries) {
        clearInterval(t)
        return
      }
      router.refresh()
    }, intervalMs)
    return () => clearInterval(t)
  }, [router, intervalMs, maxTries])

  return null
}
