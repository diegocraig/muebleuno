import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const pagina = req.nextUrl.searchParams.get('pagina') ?? 'medida'
  return NextResponse.json(await prisma.medidaPaso.findMany({ where: { pagina }, orderBy: { orden: 'asc' } }))
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.rol !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  const pagina = body.pagina ?? 'medida'
  const count = await prisma.medidaPaso.count({ where: { pagina } })
  const p = await prisma.medidaPaso.create({
    data: { pagina, numero: body.numero, titulo: body.titulo, texto: body.texto, orden: count },
  })
  return NextResponse.json(p, { status: 201 })
}
