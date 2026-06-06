import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const item = await prisma.sliderItem.update({
    where: { id: Number(id) },
    data: {
      imagen: body.imagen,
      titulo: body.titulo,
      subtitulo: body.subtitulo,
      linkUrl: body.linkUrl,
      orden: parseInt(body.orden ?? 0),
      activo: body.activo ?? true,
    },
  })
  return NextResponse.json(item)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.sliderItem.delete({ where: { id: Number(id) } })
  return NextResponse.json({ ok: true })
}
