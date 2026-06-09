import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const pagina = req.nextUrl.searchParams.get('pagina') ?? 'medida'
  const config = await prisma.medidaConfig.upsert({
    where: { pagina }, update: {}, create: { pagina },
  })
  return NextResponse.json(config)
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const pagina = req.nextUrl.searchParams.get('pagina') ?? 'medida'
  const body = await req.json()
  const config = await prisma.medidaConfig.upsert({
    where: { pagina }, update: body, create: { pagina, ...body },
  })
  return NextResponse.json(config)
}
