import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminORespuesta } from '@/lib/render/servidor'
import type { DefModulo } from '@/lib/render/tipos'

type Ctx = { params: Promise<{ productoId: string }> }
/**
 * Guarda las medidas reales de un producto para todos los proyectos. El diseño de
 * los frentes no se guarda acá: sale siempre de la ficha del producto (disenos.ts).
 */
export async function PUT(req: NextRequest, { params }: Ctx) {
  const auth = await adminORespuesta()
  if (auth.error) return auth.error
  const productoId = Number((await params).productoId)
  if (!Number.isInteger(productoId) || productoId <= 0) return NextResponse.json({ error: 'Producto inválido' }, { status: 400 })
  const prod = await prisma.producto.findUnique({ where: { id: productoId }, select: { id: true } })
  if (!prod) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })

  const b = (await req.json().catch(() => ({}))) as Partial<DefModulo>
  const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) && n > 0 && n <= 400 ? n : undefined }
  const datos: Partial<DefModulo> = {
    ...(num(b.ancho) ? { ancho: num(b.ancho) } : {}),
    ...(num(b.alto) ? { alto: num(b.alto) } : {}),
    ...(num(b.profundidad) ? { profundidad: num(b.profundidad) } : {}),
  }
  await prisma.renderModulo.upsert({
    where: { productoId },
    create: { productoId, datos: JSON.stringify(datos) },
    update: { datos: JSON.stringify(datos) },
  })
  return NextResponse.json({ ok: true, datos })
}

/** Vuelve a las medidas deducidas del nombre. */
export async function DELETE(_: NextRequest, { params }: Ctx) {
  const auth = await adminORespuesta()
  if (auth.error) return auth.error
  const productoId = Number((await params).productoId)
  if (Number.isInteger(productoId)) await prisma.renderModulo.delete({ where: { productoId } }).catch(() => null)
  return NextResponse.json({ ok: true })
}
