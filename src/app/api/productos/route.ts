import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { slugify } from '@/lib/utils'

/** Genera un slug único para Producto, añadiendo -2, -3… si ya existe. */
async function uniqueSlug(base: string, excludeId?: number): Promise<string> {
  let candidate = base
  let n = 2
  while (true) {
    const existing = await prisma.producto.findUnique({ where: { slug: candidate } })
    if (!existing || existing.id === excludeId) return candidate
    candidate = `${base}-${n++}`
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const categoria = searchParams.get('categoria')
  const destacado = searchParams.get('destacado')
  const novedad = searchParams.get('novedad')
  const enPromocion = searchParams.get('enPromocion')
  const buscar = searchParams.get('buscar')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '12')

  const ALLOWED_ORDER_BY = ['creadoEn', 'nombre', 'precio'] as const
  const ALLOWED_ORDER = ['asc', 'desc'] as const
  type AllowedOrderBy = typeof ALLOWED_ORDER_BY[number]
  type AllowedOrder = typeof ALLOWED_ORDER[number]

  const rawOrderBy = searchParams.get('orderBy') ?? 'creadoEn'
  const rawOrder = searchParams.get('order') ?? 'desc'
  const orderBy: AllowedOrderBy = (ALLOWED_ORDER_BY as readonly string[]).includes(rawOrderBy)
    ? (rawOrderBy as AllowedOrderBy)
    : 'creadoEn'
  const order: AllowedOrder = (ALLOWED_ORDER as readonly string[]).includes(rawOrder)
    ? (rawOrder as AllowedOrder)
    : 'desc'

  const where: Record<string, unknown> = { activo: true }
  if (categoria) where.categoria = { slug: categoria }
  if (destacado === 'true') where.destacado = true
  if (novedad === 'true') where.novedad = true
  if (enPromocion === 'true') where.enPromocion = true
  if (buscar) where.OR = [
    { nombre: { contains: buscar } },
    { descripcion: { contains: buscar } },
  ]

  const [total, productos] = await Promise.all([
    prisma.producto.count({ where }),
    prisma.producto.findMany({
      where,
      include: { categoria: true, subcategoria: true },
      orderBy: { [orderBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])

  return NextResponse.json({ productos, total, pages: Math.ceil(total / limit), page })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await req.json()
    const baseSlug = body.slug || slugify(body.nombre)
    const slug = await uniqueSlug(baseSlug)

    const producto = await prisma.producto.create({
      data: {
        nombre: body.nombre,
        slug,
        descripcion: body.descripcion || null,
        volumen: body.volumen ? parseFloat(body.volumen) : null,
        datosUtiles: body.datosUtiles || null,
        infoEmbalaje: body.infoEmbalaje || null,
        garantia: body.garantia || null,
        precio: parseFloat(body.precio),
        precioOferta: body.precioOferta ? parseFloat(body.precioOferta) : null,
        imagenes: JSON.stringify(body.imagenes ?? []),
        categoriaId: parseInt(body.categoriaId),
        subcategoriaId: body.subcategoriaId ? parseInt(body.subcategoriaId) : null,
        stock: parseInt(body.stock ?? 0),
        destacado: body.destacado ?? false,
        novedad: body.novedad ?? false,
        enPromocion: body.enPromocion ?? false,
        activo: body.activo ?? true,
      },
      include: { categoria: true, subcategoria: true },
    })

    return NextResponse.json(producto, { status: 201 })
  } catch (err) {
    console.error('[POST /api/productos]', err)
    return NextResponse.json({ error: 'Error al crear el producto' }, { status: 500 })
  }
}
