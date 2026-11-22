import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminORespuesta } from '@/lib/render/servidor'
import type { Columna, DefModulo } from '@/lib/render/tipos'

type Ctx = { params: Promise<{ productoId: string }> }
const TIPOS_COL = ['puerta', 'vidrio', 'cajones', 'hueco', 'micro', 'rebatible', 'bandejero', 'ciego']
const TIPOS_MOD = ['bajo', 'alacena', 'alto', 'esquinero-bajo', 'esquinero-alto']

/** Guarda cómo se dibuja un producto (medidas y frentes) para todos los proyectos. */
export async function PUT(req: NextRequest, { params }: Ctx) {
  const auth = await adminORespuesta()
  if (auth.error) return auth.error
  const productoId = Number((await params).productoId)
  const prod = await prisma.producto.findUnique({ where: { id: productoId }, select: { id: true } })
  if (!prod) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })

  const b = (await req.json().catch(() => ({}))) as Partial<DefModulo>
  const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) && n > 0 && n <= 400 ? n : undefined }
  const columnas = Array.isArray(b.columnas)
    ? (b.columnas as Columna[]).filter(c => TIPOS_COL.includes(c?.tipo)).slice(0, 8).map(c => ({
        tipo: c.tipo, ...(num(c.ancho) ? { ancho: num(c.ancho) } : {}), ...(c.cajones ? { cajones: Math.min(8, Math.max(1, Number(c.cajones) || 3)) } : {}),
      }))
    : undefined
  const datos: Partial<DefModulo> = {
    ...(TIPOS_MOD.includes(String(b.tipo)) ? { tipo: b.tipo } : {}),
    ...(num(b.ancho) ? { ancho: num(b.ancho) } : {}),
    ...(num(b.alto) ? { alto: num(b.alto) } : {}),
    ...(num(b.profundidad) ? { profundidad: num(b.profundidad) } : {}),
    ...(columnas?.length ? { columnas } : {}),
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
  await prisma.renderModulo.delete({ where: { productoId: Number((await params).productoId) } }).catch(() => null)
  return NextResponse.json({ ok: true })
}
