import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminORespuesta, listarElectros } from '@/lib/render/servidor'
import { validarElectro } from '@/lib/render/validarElectro'

export async function GET() {
  const auth = await adminORespuesta()
  if (auth.error) return auth.error
  return NextResponse.json(await listarElectros())
}

export async function POST(req: NextRequest) {
  const auth = await adminORespuesta()
  if (auth.error) return auth.error
  const v = validarElectro(await req.json().catch(() => null))
  if ('error' in v) return NextResponse.json({ error: v.error }, { status: 400 })
  const e = await prisma.electrodomestico.create({ data: v.data })
  return NextResponse.json(e, { status: 201 })
}
