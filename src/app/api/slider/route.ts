import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  const items = await prisma.sliderItem.findMany({
    where: { activo: true },
    orderBy: { orden: 'asc' },
  })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const item = await prisma.sliderItem.create({
    data: {
      imagen: body.imagen,
      titulo: body.titulo,
      subtitulo: body.subtitulo,
      linkUrl: body.linkUrl,
      orden: parseInt(body.orden ?? 0),
      activo: body.activo ?? true,
    },
  })
  return NextResponse.json(item, { status: 201 })
}
