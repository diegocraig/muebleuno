// Promo "12 cuotas sin interés": visible hasta el 18/10/2026 inclusive (hora Argentina).
const PROMO_12_CUOTAS_FIN = new Date('2026-10-19T00:00:00-03:00')

export function promo12CuotasActiva(ahora: Date = new Date()) {
  return ahora < PROMO_12_CUOTAS_FIN
}
