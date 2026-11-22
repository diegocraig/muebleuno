import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminORespuesta } from '@/lib/render/servidor'
import { validarProyecto } from '@/lib/render/validar'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, { params }: Ctx) {
  const auth = await adminORespuesta()
  if (auth.error) return auth.error
  const p = await prisma.renderProyecto.findUnique({ where: { id: Number((await params).id) } })
  if (!p) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(p)
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const auth = await adminORespuesta()
  if (auth.error) return auth.error
  const id = Number((await params).id)
  const actual = await prisma.renderProyecto.findUnique({ where: { id }, select: { id: true, estado: true } })
  if (!actual) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  const v = validarProyecto(await req.json().catch(() => null))
  if ('error' in v) return NextResponse.json({ error: v.error }, { status: 400 })
  // Una venta ya generada no vuelve a borrador desde el editor.
  const data = actual.estado === 'venta' ? { ...v.data, estado: 'venta' } : v.data
  await prisma.renderProyecto.update({ where: { id }, data })
  return NextResponse.json({ id })
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
  const auth = await adminORespuesta()
  if (auth.error) return auth.error
  await prisma.renderProyecto.delete({ where: { id: Number((await params).id) } }).catch(() => null)
  return NextResponse.json({ ok: true })
}
