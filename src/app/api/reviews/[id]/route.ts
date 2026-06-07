import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const review = await prisma.review.update({
    where: { id: parseInt(id) },
    data: {
      autor: body.autor,
      ciudad: body.ciudad || null,
      texto: body.texto,
      rating: parseInt(body.rating ?? 5),
      productoId: body.productoId ? parseInt(body.productoId) : null,
      activa: body.activa ?? true,
    },
  })
  return NextResponse.json(review)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  await prisma.review.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ ok: true })
}
