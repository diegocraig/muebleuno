import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import CategoriaFiltro from '@/components/public/CategoriaFiltro'

interface PageProps { params: Promise<{ slug: string }> }

export default async function CategoriaPage({ params }: PageProps) {
  const { slug } = await params
  const categoria = await prisma.categoria.findUnique({
    where: { slug, activa: true },
    include: {
      subcategorias: {
        where: { activa: true },
        orderBy: { orden: 'asc' },
        select: { id: true, nombre: true, slug: true },
      },
      productos: {
        where: { activo: true },
        include: { categoria: true },
        orderBy: { creadoEn: 'desc' },
      },
    },
  })
  if (!categoria) notFound()

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{categoria.nombre}</h1>
      <p className="text-gris-medio mb-6">{categoria.productos.length} productos</p>
      <CategoriaFiltro productos={categoria.productos} subcategorias={categoria.subcategorias} />
    </div>
  )
}
