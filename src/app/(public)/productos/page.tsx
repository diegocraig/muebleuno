import { prisma } from '@/lib/prisma'
import ProductoGrid from '@/components/public/ProductoGrid'
import FiltroSidebar from '@/components/public/FiltroSidebar'
import OrdenSelector from '@/components/public/OrdenSelector'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ categoria?: string; precio_min?: string; precio_max?: string; oferta?: string; novedad?: string; page?: string; order?: string; buscar?: string }>
}

export default async function ProductosPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page ?? '1')
  const limit = 12

  const where: Record<string, unknown> = { activo: true }
  if (params.categoria) where.categoria = { slug: params.categoria }
  if (params.oferta === 'true') where.enPromocion = true
  if (params.novedad === 'true') where.novedad = true
  if (params.buscar) where.OR = [
    { nombre: { contains: params.buscar } },
    { descripcion: { contains: params.buscar } },
  ]
  if (params.precio_min || params.precio_max) {
    where.precio = {}
    if (params.precio_min) (where.precio as Record<string, number>).gte = parseFloat(params.precio_min)
    if (params.precio_max) (where.precio as Record<string, number>).lte = parseFloat(params.precio_max)
  }

  let orderBy: Record<string, string> = { creadoEn: 'desc' }
  if (params.order === 'precio_asc') orderBy = { precio: 'asc' }
  else if (params.order === 'precio_desc') orderBy = { precio: 'desc' }
  else if (params.order === 'volumen_asc') orderBy = { volumen: 'asc' }
  else if (params.order === 'volumen_desc') orderBy = { volumen: 'desc' }
  else if (params.order === 'nombre') orderBy = { nombre: 'asc' }

  const [total, productos, categorias] = await Promise.all([
    prisma.producto.count({ where }),
    prisma.producto.findMany({
      where, include: { categoria: true },
      orderBy, skip: (page - 1) * limit, take: limit,
    }),
    prisma.categoria.findMany({ where: { activa: true }, orderBy: { orden: 'asc' } }),
  ])

  const pages = Math.ceil(total / limit)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        {params.buscar ? <>Resultados para &ldquo;{params.buscar}&rdquo;</> : 'Catálogo de Productos'}
      </h1>
      <div className="flex gap-8">
        <aside className="w-64 shrink-0 hidden lg:block">
          <FiltroSidebar categorias={categorias} searchParams={params} />
        </aside>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-4">
            <p className="text-gris-medio">{total} productos encontrados</p>
            <OrdenSelector current={params.order ?? ''} />
          </div>
          <ProductoGrid productos={productos} />
          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                <a
                  key={p}
                  href={`?${new URLSearchParams({ ...params, page: String(p) })}`}
                  className={`px-3 py-1.5 rounded border text-sm ${p === page ? 'bg-rojo-principal text-white border-rojo-principal' : 'hover:bg-gris-fondo'}`}
                >
                  {p}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
