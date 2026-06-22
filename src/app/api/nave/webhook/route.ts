import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getNaveToken, NAVE_PAYMENT_CHECK_BASE } from '@/lib/nave'
import { enviarReportePedido, enviarConfirmacionCompra } from '@/lib/mail'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { payment_id, external_payment_id } = body

  try {
    const token = await getNaveToken()
    const res = await fetch(`${NAVE_PAYMENT_CHECK_BASE}/${payment_id}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
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
      // Avisar a administración del resultado del pago.
      void enviarReportePedido(pedidoId, 'pago-actualizado')

      // Si el pago fue aprobado, mandar al comprador el correo de agradecimiento
      // con el detalle. Claim atómico: marca confirmacionEnviada=true sólo si
      // estaba en false, así un reintento del webhook no genera correos duplicados.
      if (naveStatus === 'APPROVED') {
        const claim = await prisma.pedido.updateMany({
          where: { id: pedidoId, confirmacionEnviada: false },
          data: { confirmacionEnviada: true },
        })
        if (claim.count > 0) void enviarConfirmacionCompra(pedidoId)
      }
    }
  } catch (e) {
    console.error('Nave webhook error:', e)
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
