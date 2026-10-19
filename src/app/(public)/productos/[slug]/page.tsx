import { prisma } from '@/lib/prisma'
import { INCLUDE_COLORES } from '@/lib/coloresServer'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import ProductoDetalle from '@/components/public/ProductoDetalle'
import ProductoGrid from '@/components/public/ProductoGrid'
import ReviewsBlock from '@/components/public/ReviewsBlock'
import PixelViewContent from '@/components/public/PixelViewContent'
import { SITE_URL, SITE_NAME } from '@/lib/seo'
import { contentId } from '@/lib/meta'
import { MONEDA } from '@/lib/pixel'
import { imagenesProducto } from '@/lib/colores'

interface PageProps { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const producto = await prisma.producto.findUnique({ where: { slug }, include: { categoria: true, ...INCLUDE_COLORES } })
  if (!producto) return {}

  const imagenes = imagenesProducto(producto)
  const precioFinal = producto.precioOferta ?? producto.precio
  const description = producto.descripcion
    ?? `Comprá ${producto.nombre} en ${SITE_NAME}. ${producto.categoria.nombre} · Envíos a todo el país.`

  return {
    title: producto.nombre,
    description,
    openGraph: {
      title: `${producto.nombre} — ${SITE_NAME}`,
      description: `$${precioFinal.toLocaleString('es-AR')} · ${producto.categoria.nombre}`,
      url: `${SITE_URL}/productos/${producto.slug}`,
      images: imagenes[0] ? [{ url: `${SITE_URL}${imagenes[0]}`, alt: producto.nombre }] : [],
    },
    // Las etiquetas og:type=product y product:* se emiten en el JSX de la página,
    // no acá: el campo `other` de Next las escribiría como <meta name="...">
    // y el crawler de Meta espera <meta property="...">.
  }
}

export default async function ProductoPage({ params }: PageProps) {
  const { slug } = await params
  const producto = await prisma.producto.findUnique({
    where: { slug, activo: true },
    include: { categoria: true, ...INCLUDE_COLORES },
  })
  if (!producto) notFound()

  const relacionados = await prisma.producto.findMany({
    where: { activo: true, categoriaId: producto.categoriaId, NOT: { id: producto.id } },
    include: { categoria: true, ...INCLUDE_COLORES },
    take: 4,
  })

  const imagenes = imagenesProducto(producto)
  const precioFinal = producto.precioOferta ?? producto.precio
  const availability = producto.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: producto.nombre,
    description: producto.descripcion ?? undefined,
    image: imagenes.map(img => `${SITE_URL}${img}`),
    sku: contentId(producto.id),
    mpn: `MU-${producto.id}`,
    brand: { '@type': 'Brand', name: SITE_NAME },
    category: producto.categoria.nombre,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'ARS',
      price: precioFinal.toFixed(2),
      availability,
      seller: { '@type': 'Organization', name: SITE_NAME },
      ...(producto.precioOferta ? {
        priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      } : {}),
    },
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      {/* Open Graph de producto — React las eleva al <head>. Complementan al feed:
          es lo que lee Meta cuando rastrea el link del producto directamente. */}
      <meta property="og:type" content="product" />
      <meta property="product:brand" content={SITE_NAME} />
      <meta property="product:availability" content={producto.stock > 0 ? 'in stock' : 'out of stock'} />
      <meta property="product:condition" content="new" />
      <meta property="product:price:amount" content={precioFinal.toFixed(2)} />
      <meta property="product:price:currency" content={MONEDA} />
      <meta property="product:retailer_item_id" content={contentId(producto.id)} />

      <PixelViewContent
        contentId={contentId(producto.id)}
        nombre={producto.nombre}
        categoria={producto.categoria.nombre}
        valor={precioFinal}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gris-medio mb-8 flex-wrap">
        <Link href="/" className="hover:text-rojo-principal transition-colors">Inicio</Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-40" />
        <Link href="/productos" className="hover:text-rojo-principal transition-colors">Productos</Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-40" />
        <Link href={`/categoria/${producto.categoria.slug}`} className="hover:text-rojo-principal transition-colors">
          {producto.categoria.nombre}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-40" />
        <span className="text-gris-oscuro font-medium truncate max-w-xs">{producto.nombre}</span>
      </nav>

      <ProductoDetalle producto={producto} />
      <ReviewsBlock productoId={producto.id} />
      {relacionados.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Productos Relacionados</h2>
          <ProductoGrid productos={relacionados} />
        </section>
      )}
    </div>
  )
}
