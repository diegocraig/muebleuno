import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.rol !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const { nombre, costo, activo } = await req.json()
  const tipo = await prisma.tipoEnvio.update({
    where: { id: parseInt(id) },
    data: { nombre, costo: parseFloat(costo), activo },
  })
  return NextResponse.json(tipo)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.rol !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.tipoEnvio.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ ok: true })
}
