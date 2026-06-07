import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  return NextResponse.json(await prisma.medidaPaso.findMany({ orderBy: { orden: 'asc' } }))
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  const count = await prisma.medidaPaso.count()
  const p = await prisma.medidaPaso.create({
    data: { numero: body.numero, titulo: body.titulo, texto: body.texto, orden: count },
  })
  return NextResponse.json(p, { status: 201 })
}
