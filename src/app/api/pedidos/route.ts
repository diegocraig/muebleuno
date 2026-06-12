import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { checkRateLimit } from '@/lib/rateLimiter'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.rol !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const estado = searchParams.get('estado')

  const pedidos = await prisma.pedido.findMany({
    where: estado ? { estado } : {},
    orderBy: { creadoEn: 'desc' },
  })
  return NextResponse.json(pedidos)
}

// 5 pedidos cada 10 minutos por IP
const MAX_PEDIDOS = 5
const WINDOW_PEDIDOS_MS = 10 * 60 * 1000

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  const limit = checkRateLimit(`pedidos:${ip}`, MAX_PEDIDOS, WINDOW_PEDIDOS_MS)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Demasiados pedidos. Intentá de nuevo en unos minutos.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    )
  }

  const body = await req.json()
  const rawItems: { productoId: number; cantidad: number }[] = body.items ?? []

  // Recalcular total desde la DB — no confiar en el precio del cliente
  const productIds = rawItems.map(i => i.productoId)
  const productos = await prisma.producto.findMany({
    where: { id: { in: productIds }, activo: true },
    select: { id: true, precio: true, precioOferta: true },
  })
  const precioMap = new Map(productos.map(p => [p.id, p.precioOferta ?? p.precio]))

  let totalProductos = 0
  for (const item of rawItems) {
    const precio = precioMap.get(item.productoId)
    if (precio == null) continue
    totalProductos += precio * item.cantidad
  }

  let costoEnvio = 0
  let tipoEnvioId: number | null = null
  if (body.tipoEnvioId) {
    const tipoEnvio = await prisma.tipoEnvio.findUnique({
      where: { id: parseInt(body.tipoEnvioId), activo: true },
    })
    if (tipoEnvio) {
      costoEnvio = tipoEnvio.costo
      tipoEnvioId = tipoEnvio.id
    }
  }

  const total = totalProductos + costoEnvio

  const pedido = await prisma.pedido.create({
    data: {
      nombre: body.nombre,
      email: body.email,
      telefono: body.telefono,
      items: JSON.stringify(body.items),
      total,
      estado: 'pendiente',
      notas: body.notas,
      tipoEnvioId,
      costoEnvio,
    },
  })
  return NextResponse.json(pedido, { status: 201 })
}
