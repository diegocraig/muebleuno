import { prisma } from '@/lib/prisma'
import StockAdmin from '@/components/admin/StockAdmin'

export default async function StockPage() {
  const productos = await prisma.producto.findMany({
    select: {
      id: true,
      nombre: true,
      stock: true,
      precio: true,
      precioOferta: true,
      activo: true,
      categoria: { select: { nombre: true } },
    },
    orderBy: { nombre: 'asc' },
  })

  return <StockAdmin productos={productos} />
}
