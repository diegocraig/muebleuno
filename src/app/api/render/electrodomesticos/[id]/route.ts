import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminORespuesta } from '@/lib/render/servidor'
import { validarElectro } from '@/lib/render/validarElectro'

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Ctx) {
  const auth = await adminORespuesta()
  if (auth.error) return auth.error
  const v = validarElectro(await req.json().catch(() => null))
  if ('error' in v) return NextResponse.json({ error: v.error }, { status: 400 })
  const id = Number((await params).id)
  const e = Number.isInteger(id) ? await prisma.electrodomestico.update({ where: { id }, data: v.data }).catch(() => null) : null
  if (!e) return NextResponse.json({ error: 'Modelo no encontrado' }, { status: 404 })
  return NextResponse.json(e)
}

// Baja lógica: así la base de referencia no lo vuelve a cargar.
export async function DELETE(_: NextRequest, { params }: Ctx) {
  const auth = await adminORespuesta()
  if (auth.error) return auth.error
  const id = Number((await params).id)
  if (Number.isInteger(id)) await prisma.electrodomestico.update({ where: { id }, data: { activo: false } }).catch(() => null)
  return NextResponse.json({ ok: true })
}
