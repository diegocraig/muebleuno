import { prisma } from '@/lib/prisma'
import ProductoGrid from '@/components/public/ProductoGrid'

export const dynamic = 'force-dynamic'

export default async function NovedadesPage() {
  const productos = await prisma.producto.findMany({
    where: { activo: true, novedad: true },
    include: { categoria: true },
    orderBy: { creadoEn: 'desc' },
  })
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Novedades</h1>
      <ProductoGrid productos={productos} />
    </div>
  )
}
