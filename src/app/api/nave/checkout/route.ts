import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getNaveToken, NAVE_PAYMENT_URL } from '@/lib/nave'
import { enviarReportePedido } from '@/lib/mail'
import { checkRateLimit } from '@/lib/rateLimiter'
import { resolverLineas } from '@/lib/coloresServer'
import { nombreConColor } from '@/lib/colores'

// 10 checkouts cada 10 minutos por IP — frena creación masiva de pedidos y el
// bombardeo de correos al admin, sin molestar a un comprador que reintenta.
const MAX_CHECKOUTS = 10
const WINDOW_CHECKOUT_MS = 10 * 60 * 1000

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  const limit = checkRateLimit(`checkout:${ip}`, MAX_CHECKOUTS, WINDOW_CHECKOUT_MS)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Demasiados intentos de pago. Esperá unos minutos.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    )
  }

  const body = await req.json()
  const { nombre, email, telefono, dni, notas, direccion } = body

  // Recalcular precios desde la DB y validar colores — no confiar en el precio/total del cliente
  const res = await resolverLineas(body.items)
  if ('error' in res) return NextResponse.json({ error: res.error }, { status: 400 })
  const { lineas } = res

  const totalProductos = lineas.reduce((acc, l) => acc + l.precio * l.cantidad, 0)

  // Validar tipo de envío contra la DB
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
      nombre,
      email,
      telefono,
      dni: dni || null,
      notas: notas || null,
      direccion: direccion || null,
      items: JSON.stringify(lineas),
      total,
      estado: 'pendiente',
      tipoEnvioId,
      costoEnvio,
    },
  })

  // Avisar a administración del intento de compra (aunque el pago no se complete).
  void enviarReportePedido(pedido.id, 'nuevo-tarjeta')

  const token = await getNaveToken()

  const siteUrl = process.env.NEXTAUTH_URL ?? 'https://muebleuno.com'

  const payload = {
    external_payment_id: String(pedido.id),
    seller: { pos_id: process.env.NAVE_POS_ID },
    transactions: [
      {
        amount: { currency: 'ARS', value: total.toFixed(2) },
        products: lineas.map(l => ({
          name: nombreConColor(l).slice(0, 100),
          description: nombreConColor(l).slice(0, 100),
          quantity: l.cantidad,
          unit_price: { currency: 'ARS', value: l.precio.toFixed(2) },
        })),
      },
    ],
    buyer: { name: nombre, user_email: email, phone: telefono },
    additional_info: {
      callback_url: `${siteUrl}/estado-pago?pedido=${pedido.id}`,
      notification_url: `${siteUrl}/api/nave/webhook`,
    },
    duration_time: 3600,
  }

  const naveRes = await fetch(NAVE_PAYMENT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'Mozilla/5.0',
    },
    body: JSON.stringify(payload),
  })

  if (!naveRes.ok) {
    const err = await naveRes.text()
    return NextResponse.json({ error: `Nave error: ${err}` }, { status: 502 })
  }

  const payment = await naveRes.json()

  await prisma.pedido.update({
    where: { id: pedido.id },
    data: { navePaymentRequestId: payment.id },
  })

  return NextResponse.json({ checkout_url: payment.checkout_url })
}
