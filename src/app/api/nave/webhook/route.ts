import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getNaveToken, NAVE_PAYMENT_CHECK_BASE } from '@/lib/nave'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { payment_id, external_payment_id } = body

  try {
    const token = await getNaveToken()
    const res = await fetch(`${NAVE_PAYMENT_CHECK_BASE}/${payment_id}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })

    if (!res.ok) return NextResponse.json({ ok: false }, { status: 200 })

    const payment = await res.json()
    const naveStatus: string = payment.status?.name ?? 'UNKNOWN'

    const estadoMap: Record<string, string> = {
      APPROVED: 'pagado',
      REJECTED: 'rechazado',
      CANCELLED: 'cancelado',
      REFUNDED: 'devuelto',
    }

    const pedidoId = parseInt(external_payment_id)
    if (!isNaN(pedidoId)) {
      await prisma.pedido.update({
        where: { id: pedidoId },
        data: {
          navePagoEstado: naveStatus,
          estado: estadoMap[naveStatus] ?? 'pendiente',
        },
      })
    }
  } catch (e) {
    console.error('Nave webhook error:', e)
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
