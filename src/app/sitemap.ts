import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { SITE_URL, BASE_PATH } from '@/lib/seo'

const url = (path: string) => `${SITE_URL}${BASE_PATH}${path}`

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let productos: { slug: string; actualizadoEn: Date }[] = []
  let categorias: { slug: string }[] = []
  let subcategorias: { slug: string }[] = []

  try {
    ;[productos, categorias, subcategorias] = await Promise.all([
      prisma.producto.findMany({ where: { activo: true }, select: { slug: true, actualizadoEn: true } }),
      prisma.categoria.findMany({ where: { activa: true }, select: { slug: true } }),
      prisma.subcategoria.findMany({ where: { activa: true }, select: { slug: true } }),
    ])
  } catch {
    // DB no disponible en build time — se genera con solo páginas estáticas
  }

  const staticPages: MetadataRoute.Sitemap = [
    { url: url(''),              lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: url('/productos'),    lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: url('/novedades'),    lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: url('/promociones'),  lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: url('/quienes-somos'),lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: url('/contacto'),     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  const productPages: MetadataRoute.Sitemap = productos.map(p => ({
    url: url(`/productos/${p.slug}`),
    lastModified: p.actualizadoEn,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const categoriaPages: MetadataRoute.Sitemap = categorias.map(c => ({
    url: url(`/categoria/${c.slug}`),
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  const subcategoriaPages: MetadataRoute.Sitemap = subcategorias.map(s => ({
    url: url(`/subcategoria/${s.slug}`),
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticPages, ...productPages, ...categoriaPages, ...subcategoriaPages]
}
