import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getNaveToken, NAVE_PAYMENT_URL } from '@/lib/nave'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { nombre, email, telefono, notas, items, total } = body

  const pedido = await prisma.pedido.create({
    data: {
      nombre,
      email,
      telefono,
      notas: notas || null,
      items: JSON.stringify(items),
      total: parseFloat(total),
      estado: 'pendiente',
    },
  })

  const token = await getNaveToken()

  const siteUrl = process.env.NEXTAUTH_URL ?? 'https://muebleuno.com'

  const payload = {
    external_payment_id: String(pedido.id),
    seller: { pos_id: process.env.NAVE_POS_ID },
    transactions: [
      {
        amount: { currency: 'ARS', value: parseFloat(total).toFixed(2) },
        products: items.map((i: { nombre: string; cantidad: number; precio: number }) => ({
          name: i.nombre.slice(0, 100),
          description: i.nombre.slice(0, 100),
          quantity: i.cantidad,
          unit_price: { currency: 'ARS', value: i.precio.toFixed(2) },
        })),
      },
    ],
    buyer: { name: nombre, user_email: email, phone: telefono },
    additional_info: {
      callback_url: `${siteUrl}/pago-exitoso?pedido=${pedido.id}`,
    },
    duration_time: 3600,
  }

  const naveRes = await fetch(NAVE_PAYMENT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
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
