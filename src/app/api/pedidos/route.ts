import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { checkRateLimit } from '@/lib/rateLimiter'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

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

  const pedido = await prisma.pedido.create({
    data: {
      nombre: body.nombre,
      email: body.email,
      telefono: body.telefono,
      items: JSON.stringify(body.items),
      total: parseFloat(body.total),
      estado: 'pendiente',
      notas: body.notas,
      tipoEnvioId: body.tipoEnvioId ?? null,
      costoEnvio: parseFloat(body.costoEnvio ?? 0),
    },
  })
  return NextResponse.json(pedido, { status: 201 })
}
