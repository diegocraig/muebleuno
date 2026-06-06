import { prisma } from '@/lib/prisma'
import CategoriasAdmin from '@/components/admin/CategoriasAdmin'

export default async function AdminCategoriasPage() {
  const categorias = await prisma.categoria.findMany({
    orderBy: { orden: 'asc' },
    include: { _count: { select: { productos: true } } },
  })
  return <CategoriasAdmin categorias={categorias} />
}
