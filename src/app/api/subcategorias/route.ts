import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { slugify } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const categoriaId = searchParams.get('categoriaId')

  const subcategorias = await prisma.subcategoria.findMany({
    where: categoriaId ? { categoriaId: parseInt(categoriaId) } : undefined,
    orderBy: [{ categoriaId: 'asc' }, { orden: 'asc' }],
    include: {
      categoria: { select: { id: true, nombre: true } },
      _count: { select: { productos: true } },
    },
  })
  return NextResponse.json(subcategorias)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const slug = body.slug || slugify(body.nombre)

  const subcategoria = await prisma.subcategoria.create({
    data: {
      nombre: body.nombre,
      slug,
      imagen: body.imagen,
      orden: parseInt(body.orden ?? 0),
      activa: body.activa ?? true,
      categoriaId: parseInt(body.categoriaId),
    },
    include: {
      categoria: { select: { id: true, nombre: true } },
      _count: { select: { productos: true } },
    },
  })
  return NextResponse.json(subcategoria, { status: 201 })
}
