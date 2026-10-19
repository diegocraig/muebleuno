import { prisma } from '@/lib/prisma'
import ProductosAdmin from '@/components/admin/ProductosAdmin'

export default async function AdminProductosPage() {
  const [productos, categorias, subcategorias] = await Promise.all([
    prisma.producto.findMany({
      include: { categoria: true, subcategoria: true, colores: { orderBy: { orden: 'asc' } } },
      orderBy: { creadoEn: 'desc' },
    }),
    prisma.categoria.findMany({ orderBy: { orden: 'asc' } }),
    prisma.subcategoria.findMany({ orderBy: [{ categoriaId: 'asc' }, { orden: 'asc' }] }),
  ])

  return <ProductosAdmin productos={productos} categorias={categorias} subcategorias={subcategorias} />
}
