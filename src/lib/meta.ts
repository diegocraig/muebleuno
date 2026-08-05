import { prisma } from '@/lib/prisma'
import { SITE_URL, SITE_NAME } from '@/lib/seo'
import { MONEDA } from '@/lib/pixel'

// ID de producto compartido entre el feed de catálogo y los eventos del Pixel.
// Meta cruza los dos por este valor, así que TIENE que ser el mismo en ambos lados.
export const contentId = (productoId: number) => String(productoId)

export interface FeedItem {
  id: string
  title: string
  description: string
  link: string
  imageLink: string
  additionalImageLinks: string[]
  availability: 'in stock' | 'out of stock'
  price: string
  salePrice: string | null
  brand: string
  condition: 'new'
  productType: string
  mpn: string
}

const absoluta = (path: string) =>
  path.startsWith('http') ? path : `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`

// Meta/Google rechazan descripciones con saltos de línea sueltos o HTML.
const limpiar = (texto: string, max: number) =>
  texto
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)

const precioFeed = (valor: number) => `${valor.toFixed(2)} ${MONEDA}`

type ProductoFeed = {
  id: number
  nombre: string
  slug: string
  descripcion: string | null
  precio: number
  precioOferta: number | null
  imagenes: string
  stock: number
  categoria: { nombre: string }
  subcategoria: { nombre: string } | null
}

export function toFeedItem(p: ProductoFeed): FeedItem | null {
  let imagenes: string[] = []
  try {
    const parsed = JSON.parse(p.imagenes || '[]')
    if (Array.isArray(parsed)) imagenes = parsed.filter(i => typeof i === 'string' && i.length > 0)
  } catch {
    imagenes = []
  }

  // Meta descarta el item si no tiene imagen o si el precio es 0 — mejor no mandarlo
  // que ensuciar el catálogo con errores.
  if (imagenes.length === 0 || p.precio <= 0) return null

  const tieneOferta = p.precioOferta != null && p.precioOferta > 0 && p.precioOferta < p.precio

  const descripcion = limpiar(
    p.descripcion?.trim() ||
      `${p.nombre} — ${p.categoria.nombre} de ${SITE_NAME}. Fabricación propia, envíos a todo el país.`,
    5000,
  )

  return {
    id: contentId(p.id),
    title: limpiar(p.nombre, 150),
    description: descripcion,
    link: `${SITE_URL}/productos/${p.slug}`,
    imageLink: absoluta(imagenes[0]),
    additionalImageLinks: imagenes.slice(1, 11).map(absoluta),
    availability: p.stock > 0 ? 'in stock' : 'out of stock',
    price: precioFeed(p.precio),
    salePrice: tieneOferta ? precioFeed(p.precioOferta!) : null,
    brand: SITE_NAME,
    condition: 'new',
    productType: [p.categoria.nombre, p.subcategoria?.nombre].filter(Boolean).join(' > '),
    mpn: `MU-${p.id}`,
  }
}

export async function getFeedItems(): Promise<FeedItem[]> {
  const productos = await prisma.producto.findMany({
    where: { activo: true, categoria: { activa: true } },
    select: {
      id: true,
      nombre: true,
      slug: true,
      descripcion: true,
      precio: true,
      precioOferta: true,
      imagenes: true,
      stock: true,
      categoria: { select: { nombre: true } },
      subcategoria: { select: { nombre: true } },
    },
    orderBy: { id: 'asc' },
  })

  return productos.map(toFeedItem).filter((i): i is FeedItem => i !== null)
}
