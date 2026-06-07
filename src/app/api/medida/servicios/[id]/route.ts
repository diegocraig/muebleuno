import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const s = await prisma.medidaServicio.update({
    where: { id: Number(id) },
    data: { titulo: body.titulo, descripcion: body.descripcion, items: JSON.stringify(body.items ?? []), activo: body.activo ?? true },
  })
  return NextResponse.json(s)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  await prisma.medidaServicio.delete({ where: { id: Number(id) } })
  return NextResponse.json({ ok: true })
}
