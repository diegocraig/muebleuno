import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { slugify } from '@/lib/utils'
import { normalizarColores, guardarColores, sincronizarStock } from '@/lib/coloresServer'

/** Genera un slug único para Producto, ignorando el id del registro que se está editando. */
async function uniqueSlug(base: string, excludeId: number): Promise<string> {
  let candidate = base
  let n = 2
  while (true) {
    const existing = await prisma.producto.findUnique({ where: { slug: candidate } })
    if (!existing || existing.id === excludeId) return candidate
    candidate = `${base}-${n++}`
  }
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const producto = await prisma.producto.findFirst({
    where: isNaN(Number(id)) ? { slug: id } : { id: Number(id) },
    include: { categoria: true, subcategoria: true, colores: { orderBy: { orden: 'asc' } } },
  })
  if (!producto) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(producto)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.rol !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { id } = await params
    const numId = Number(id)
    const body = await req.json()
    // colores ausente = no tocar los colores (otros clientes de la API)
    const norm = body.colores === undefined ? null : normalizarColores(body.colores)
    if (norm && 'error' in norm) return NextResponse.json({ error: norm.error }, { status: 400 })

    const baseSlug = body.slug || slugify(body.nombre)
    const slug = await uniqueSlug(baseSlug, numId)

    const producto = await prisma.$transaction(async tx => {
      await tx.producto.update({
        where: { id: numId },
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
      })
      // Sin "colores" en el body igual se recalcula: el stock del body no aplica si tiene colores.
      if (norm) await guardarColores(tx, numId, norm.colores)
      else await sincronizarStock(tx, numId)
      return tx.producto.findUniqueOrThrow({
        where: { id: numId },
        include: { categoria: true, subcategoria: true, colores: { orderBy: { orden: 'asc' } } },
      })
    })

    return NextResponse.json(producto)
  } catch (err) {
    console.error('[PUT /api/productos/:id]', err)
    return NextResponse.json({ error: 'Error al actualizar el producto' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.rol !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.producto.delete({ where: { id: Number(id) } })
  return NextResponse.json({ ok: true })
}
