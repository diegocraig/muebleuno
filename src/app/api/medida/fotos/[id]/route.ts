import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.rol !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  return NextResponse.json(await prisma.medidaFoto.update({
    where: { id: Number(id) }, data: { titulo: body.titulo, activo: body.activo },
  }))
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.rol !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  await prisma.medidaFoto.delete({ where: { id: Number(id) } })
  return NextResponse.json({ ok: true })
}
