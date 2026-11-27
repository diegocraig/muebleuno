// Promo "12 cuotas sin interés" (hora Argentina): visible desde INICIO inclusive hasta FIN exclusive.
// Actual: viernes 27 y sábado 28/11/2026.
const PROMO_12_CUOTAS_INICIO = new Date('2026-11-27T00:00:00-03:00')
const PROMO_12_CUOTAS_FIN = new Date('2026-11-29T00:00:00-03:00')

export function promo12CuotasActiva(ahora: Date = new Date()) {
  return ahora >= PROMO_12_CUOTAS_INICIO && ahora < PROMO_12_CUOTAS_FIN
}

// Flyer del popup de portada. null = la promo corre sin popup.
// Para usar uno: subir la imagen a public/promos/ y completar { src, alt, width, height }.
export const PROMO_12_CUOTAS_FLYER: { src: string; alt: string; width: number; height: number } | null = {
  src: '/promos/12-cuotas-13-y-14-noviembre.webp',
  alt: 'Viernes y sábado: 12 cuotas sin interés en nuestro local y la web. Solo productos standard, no incluye productos a medida',
  width: 900,
  height: 1600,
}
