import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const pagina = req.nextUrl.searchParams.get('pagina') ?? 'medida'
  const servicios = await prisma.medidaServicio.findMany({ where: { pagina }, orderBy: { orden: 'asc' } })
  return NextResponse.json(servicios)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  const pagina = body.pagina ?? 'medida'
  const count = await prisma.medidaServicio.count({ where: { pagina } })
  const s = await prisma.medidaServicio.create({
    data: { pagina, titulo: body.titulo, descripcion: body.descripcion, items: JSON.stringify(body.items ?? []), orden: count },
  })
  return NextResponse.json(s, { status: 201 })
}
