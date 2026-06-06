import { prisma } from '@/lib/prisma'
import ProductoGrid from '@/components/public/ProductoGrid'

export default async function PromocionesPage() {
  const productos = await prisma.producto.findMany({
    where: { activo: true, enPromocion: true },
    include: { categoria: true },
    orderBy: { creadoEn: 'desc' },
  })
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-rojo-principal text-white rounded-xl p-8 mb-8">
        <h1 className="text-4xl font-bold mb-2">Promociones</h1>
        <p className="text-xl opacity-90">Los mejores precios en muebles de calidad</p>
      </div>
      <ProductoGrid productos={productos} />
    </div>
  )
}
