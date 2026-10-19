import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { checkRateLimit } from '@/lib/rateLimiter'
import { enviarReportePedido } from '@/lib/mail'
import { resolverLineas } from '@/lib/coloresServer'

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

  // Recalcular total desde la DB y validar colores — no confiar en el cliente
  const res = await resolverLineas(body.items)
  if ('error' in res) return NextResponse.json({ error: res.error }, { status: 400 })
  const totalProductos = res.lineas.reduce((acc, l) => acc + l.precio * l.cantidad, 0)

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
      dni: body.dni || null,
      items: JSON.stringify(res.lineas),
      total,
      estado: 'pendiente',
      notas: body.notas,
      direccion: body.direccion || null,
      tipoEnvioId,
      costoEnvio,
    },
  })

  // Avisar a administración del nuevo pedido (solicitud de contacto).
  void enviarReportePedido(pedido.id, 'nuevo-contacto')

  return NextResponse.json(pedido, { status: 201 })
}
