import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  const config = await prisma.configuracion.findUnique({ where: { id: 1 } })
  return NextResponse.json(config ?? {})
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session || session.rol !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const config = await prisma.configuracion.upsert({
    where: { id: 1 },
    update: body,
    create: { id: 1, ...body },
  })
  return NextResponse.json(config)
}
