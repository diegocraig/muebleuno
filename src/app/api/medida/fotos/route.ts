import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  return NextResponse.json(await prisma.medidaFoto.findMany({ orderBy: { orden: 'asc' } }))
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  const count = await prisma.medidaFoto.count()
  return NextResponse.json(await prisma.medidaFoto.create({
    data: { imagen: body.imagen, titulo: body.titulo ?? null, orden: count },
  }), { status: 201 })
}
