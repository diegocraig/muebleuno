import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  const tipos = await prisma.tipoEnvio.findMany({ orderBy: { id: 'asc' } })
  return NextResponse.json(tipos)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { nombre, costo, activo } = await req.json()
  const tipo = await prisma.tipoEnvio.create({
    data: { nombre, costo: parseFloat(costo), activo: activo ?? true },
  })
  return NextResponse.json(tipo, { status: 201 })
}
