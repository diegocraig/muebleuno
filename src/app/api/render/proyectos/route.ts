import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminORespuesta } from '@/lib/render/servidor'
import { validarProyecto } from '@/lib/render/validar'

export async function GET() {
  const auth = await adminORespuesta()
  if (auth.error) return auth.error
  const proyectos = await prisma.renderProyecto.findMany({
    orderBy: { actualizadoEn: 'desc' },
    select: { id: true, nombre: true, cliente: true, total: true, estado: true, captura: true, pedidoId: true, actualizadoEn: true },
  })
  return NextResponse.json(proyectos)
}

export async function POST(req: NextRequest) {
  const auth = await adminORespuesta()
  if (auth.error) return auth.error
  const v = validarProyecto(await req.json().catch(() => null))
  if ('error' in v) return NextResponse.json({ error: v.error }, { status: 400 })
  const p = await prisma.renderProyecto.create({ data: v.data })
  return NextResponse.json({ id: p.id }, { status: 201 })
}
