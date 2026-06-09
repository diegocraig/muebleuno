import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProductosOrdenables from '@/components/public/ProductosOrdenables'

interface PageProps { params: Promise<{ slug: string }> }

export default async function SubcategoriaPage({ params }: PageProps) {
  const { slug } = await params
  const subcategoria = await prisma.subcategoria.findUnique({
    where: { slug, activa: true },
    include: {
      categoria: true,
      productos: {
        where: { activo: true },
        include: { categoria: true },
        orderBy: { creadoEn: 'desc' },
      },
    },
  })
  if (!subcategoria) notFound()

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav className="text-sm text-gris-medio mb-4 flex items-center gap-1">
        <Link href={`/categoria/${subcategoria.categoria.slug}`} className="hover:text-rojo-principal transition-colors">
          {subcategoria.categoria.nombre}
        </Link>
        <span>/</span>
        <span className="text-gris-oscuro font-medium">{subcategoria.nombre}</span>
      </nav>
      <h1 className="text-3xl font-bold mb-2">{subcategoria.nombre}</h1>
      <p className="text-gris-medio mb-8">{subcategoria.productos.length} productos</p>
      <ProductosOrdenables productos={subcategoria.productos} />
    </div>
  )
}
