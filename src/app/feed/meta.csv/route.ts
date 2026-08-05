import { getFeedItems } from '@/lib/meta'

// Misma data que /feed/meta.xml pero en CSV, por si marketing prefiere subirlo
// a mano o revisarlo en Excel. El XML es el que conviene programar en Meta.

export const dynamic = 'force-dynamic'
export const revalidate = 0

const COLUMNAS = [
  'id',
  'title',
  'description',
  'availability',
  'condition',
  'price',
  'sale_price',
  'link',
  'image_link',
  'additional_image_link',
  'brand',
  'mpn',
  'product_type',
] as const

const celda = (valor: string) => `"${valor.replace(/"/g, '""')}"`

export async function GET() {
  const items = await getFeedItems()

  const filas = items.map(i =>
    [
      i.id,
      i.title,
      i.description,
      i.availability,
      i.condition,
      i.price,
      i.salePrice ?? '',
      i.link,
      i.imageLink,
      i.additionalImageLinks.join(','),
      i.brand,
      i.mpn,
      i.productType,
    ]
      .map(celda)
      .join(','),
  )

  // BOM para que Excel abra bien los acentos
  const csv = '﻿' + [COLUMNAS.join(','), ...filas].join('\r\n') + '\r\n'

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      'X-Robots-Tag': 'noindex',
    },
  })
}
