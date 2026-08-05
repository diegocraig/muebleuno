// Helpers client-side para el Meta Pixel. Son no-op si el pixel no está
// configurado (META_PIXEL_ID vacío) o si el script todavía no cargó,
// así que nunca rompen el flujo de compra.

type Fbq = (...args: unknown[]) => void

declare global {
  interface Window {
    fbq?: Fbq
  }
}

// Moneda usada tanto en el feed como en los eventos del Pixel.
export const MONEDA = 'ARS'

export function trackPixel(evento: string, params?: Record<string, unknown>, opts?: { eventID?: string }) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return
  try {
    if (opts?.eventID) window.fbq('track', evento, params ?? {}, { eventID: opts.eventID })
    else window.fbq('track', evento, params ?? {})
  } catch {
    // el tracking nunca debe tirar abajo la UI
  }
}
