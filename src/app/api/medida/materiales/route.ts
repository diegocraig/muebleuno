import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  return NextResponse.json(await prisma.medidaMaterial.findMany({ orderBy: { orden: 'asc' } }))
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.rol !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  const count = await prisma.medidaMaterial.count()
  return NextResponse.json(await prisma.medidaMaterial.create({
    data: { nombre: body.nombre, detalle: body.detalle, orden: count },
  }), { status: 201 })
}
