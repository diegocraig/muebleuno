import { slugify } from './utils'

// Helpers de colores compartidos entre server y cliente (sin Prisma).

export interface ColorProducto {
  id: number
  nombre: string
  hex?: string | null
  imagenes: string
  stock: number
  orden?: number
}

export function parseImagenes(raw: string | null | undefined): string[] {
  try {
    const parsed = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed.filter((i): i is string => typeof i === 'string' && i.length > 0) : []
  } catch {
    return []
  }
}

/** Slug del color para el parámetro ?color= de la ficha. */
export const colorSlug = (nombre: string) => slugify(nombre)

/**
 * Fotos para mostrar el producto fuera de la ficha (cards, buscador, feed, OG).
 * Si no tiene fotos generales, usa las del primer color.
 */
export function imagenesProducto(p: { imagenes: string; colores?: ColorProducto[] | null }): string[] {
  const generales = parseImagenes(p.imagenes)
  if (generales.length || !p.colores?.length) return generales
  return parseImagenes(p.colores[0].imagenes)
}

/** Primera foto de un color, para la miniatura del selector, el carrito y los pedidos. */
export const imagenColor = (c: Pick<ColorProducto, 'imagenes'>) => parseImagenes(c.imagenes)[0] ?? ''

export const HEX_RE = /^#[0-9a-fA-F]{6}$/
export const MAX_NOMBRE_COLOR = 40

/** Nombre de la línea con el color, para Nave, mails y mensajes. */
export const nombreConColor = (l: { nombre: string; colorNombre?: string | null }) =>
  l.colorNombre ? `${l.nombre} — ${l.colorNombre}` : l.nombre
