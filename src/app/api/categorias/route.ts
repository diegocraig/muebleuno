import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { slugify } from '@/lib/utils'

export async function GET() {
  const categorias = await prisma.categoria.findMany({
    orderBy: { orden: 'asc' },
    include: {
      _count: { select: { productos: true } },
      subcategorias: {
        where: { activa: true },
        orderBy: { orden: 'asc' },
        select: { id: true, nombre: true, slug: true },
      },
    },
  })
  return NextResponse.json(categorias)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.rol !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const slug = body.slug || slugify(body.nombre)

  const categoria = await prisma.categoria.create({
    data: {
      nombre: body.nombre,
      slug,
      imagen: body.imagen,
      orden: parseInt(body.orden ?? 0),
      activa: body.activa ?? true,
      tipoBoton: body.tipoBoton ?? 'catalogo',
      urlPagina: body.tipoBoton === 'pagina' ? (body.urlPagina ?? null) : null,
    },
  })
  return NextResponse.json(categoria, { status: 201 })
}
