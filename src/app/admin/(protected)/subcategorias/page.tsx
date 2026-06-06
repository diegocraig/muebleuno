import { prisma } from '@/lib/prisma'
import SubcategoriasAdmin from '@/components/admin/SubcategoriasAdmin'

export default async function AdminSubcategoriasPage() {
  const [subcategorias, categorias] = await Promise.all([
    prisma.subcategoria.findMany({
      orderBy: [{ categoriaId: 'asc' }, { orden: 'asc' }],
      include: {
        categoria: { select: { id: true, nombre: true } },
        _count: { select: { productos: true } },
      },
    }),
    prisma.categoria.findMany({ orderBy: { orden: 'asc' } }),
  ])

  return <SubcategoriasAdmin subcategorias={subcategorias} categorias={categorias} />
}
