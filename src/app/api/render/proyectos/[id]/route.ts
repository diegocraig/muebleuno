import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminORespuesta } from '@/lib/render/servidor'
import { validarProyecto } from '@/lib/render/validar'

type Ctx = { params: Promise<{ id: string }> }
const idDe = async (params: Ctx['params']) => { const n = Number((await params).id); return Number.isInteger(n) && n > 0 ? n : 0 }

export async function GET(_: NextRequest, { params }: Ctx) {
  const auth = await adminORespuesta()
  if (auth.error) return auth.error
  const p = await prisma.renderProyecto.findUnique({ where: { id: await idDe(params) } })
  if (!p) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(p)
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const auth = await adminORespuesta()
  if (auth.error) return auth.error
  const id = await idDe(params)
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
  await prisma.renderProyecto.delete({ where: { id: await idDe(params) } }).catch(() => null)
  return NextResponse.json({ ok: true })
}
