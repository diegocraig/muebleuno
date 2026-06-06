import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ProductoDetalle from '@/components/public/ProductoDetalle'
import ProductoGrid from '@/components/public/ProductoGrid'

interface PageProps { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const producto = await prisma.producto.findUnique({ where: { slug }, include: { categoria: true } })
  if (!producto) return {}
  return { title: `${producto.nombre} — Mueble UNO`, description: producto.descripcion ?? '' }
}

export default async function ProductoPage({ params }: PageProps) {
  const { slug } = await params
  const producto = await prisma.producto.findUnique({
    where: { slug, activo: true },
    include: { categoria: true },
  })
  if (!producto) notFound()

  const relacionados = await prisma.producto.findMany({
    where: { activo: true, categoriaId: producto.categoriaId, NOT: { id: producto.id } },
    include: { categoria: true },
    take: 4,
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <ProductoDetalle producto={producto} />
      {relacionados.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Productos Relacionados</h2>
          <ProductoGrid productos={relacionados} />
        </section>
      )}
    </div>
  )
}
