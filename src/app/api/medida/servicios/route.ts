import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  const servicios = await prisma.medidaServicio.findMany({ orderBy: { orden: 'asc' } })
  return NextResponse.json(servicios)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  const count = await prisma.medidaServicio.count()
  const s = await prisma.medidaServicio.create({
    data: { titulo: body.titulo, descripcion: body.descripcion, items: JSON.stringify(body.items ?? []), orden: count },
  })
  return NextResponse.json(s, { status: 201 })
}
