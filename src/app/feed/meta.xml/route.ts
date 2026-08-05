import { getFeedItems } from '@/lib/meta'
import { SITE_URL, SITE_NAME } from '@/lib/seo'

// Feed de catálogo para Meta (Commerce Manager) y Google Shopping.
// Se genera en vivo desde la DB: lo que se cambia en el panel aparece acá al toque.
// Alta en Meta: Commerce Manager > Catálogo > Fuentes de datos > Feed programado,
// URL https://muebleuno.com/feed/meta.xml, frecuencia cada 4-6 hs.

export const dynamic = 'force-dynamic'
export const revalidate = 0

const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    // caracteres de control: ilegales en XML 1.0, rompen el parseo del feed entero
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')

export async function GET() {
  const items = await getFeedItems()

  const xmlItems = items
    .map(i => {
      const campos = [
        `<g:id>${esc(i.id)}</g:id>`,
        `<g:title>${esc(i.title)}</g:title>`,
        `<g:description>${esc(i.description)}</g:description>`,
        `<g:link>${esc(i.link)}</g:link>`,
        `<g:image_link>${esc(i.imageLink)}</g:image_link>`,
        ...i.additionalImageLinks.map(u => `<g:additional_image_link>${esc(u)}</g:additional_image_link>`),
        `<g:availability>${i.availability}</g:availability>`,
        `<g:price>${esc(i.price)}</g:price>`,
        ...(i.salePrice ? [`<g:sale_price>${esc(i.salePrice)}</g:sale_price>`] : []),
        `<g:condition>${i.condition}</g:condition>`,
        `<g:brand>${esc(i.brand)}</g:brand>`,
        `<g:mpn>${esc(i.mpn)}</g:mpn>`,
        ...(i.productType ? [`<g:product_type>${esc(i.productType)}</g:product_type>`] : []),
      ]
      return `    <item>\n      ${campos.join('\n      ')}\n    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${esc(SITE_NAME)}</title>
    <link>${esc(SITE_URL)}</link>
    <description>Catálogo de productos de ${esc(SITE_NAME)}</description>
${xmlItems}
  </channel>
</rss>
`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      'X-Robots-Tag': 'noindex',
    },
  })
}
