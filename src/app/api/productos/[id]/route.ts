import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { slugify } from '@/lib/utils'

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
    include: { categoria: true, subcategoria: true },
  })
  if (!producto) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(producto)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { id } = await params
    const numId = Number(id)
    const body = await req.json()
    const baseSlug = body.slug || slugify(body.nombre)
    const slug = await uniqueSlug(baseSlug, numId)

    const producto = await prisma.producto.update({
      where: { id: numId },
      data: {
        nombre: body.nombre,
        slug,
        descripcion: body.descripcion || null,
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

    return NextResponse.json(producto)
  } catch (err) {
    console.error('[PUT /api/productos/:id]', err)
    return NextResponse.json({ error: 'Error al actualizar el producto' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.producto.delete({ where: { id: Number(id) } })
  return NextResponse.json({ ok: true })
}
