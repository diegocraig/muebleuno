import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getNaveToken, NAVE_PAYMENT_CHECK_BASE } from '@/lib/nave'
import { enviarReportePedido, enviarConfirmacionCompra } from '@/lib/mail'

// Extrae el external_payment_id (= id de nuestro pedido) que Nave devuelve dentro
// del objeto del pago. Es el dato AUTORITATIVO: lo fijó el checkout server-side y
// Nave lo refleja. El valor del body es controlado por el cliente y no se confía.
function naveExternalId(payment: unknown): string | null {
  const p = payment as Record<string, unknown> | null
  const candidatos = [
    p?.external_payment_id,
    p?.external_reference,
    (p?.payment_request as Record<string, unknown> | undefined)?.external_payment_id,
    (p?.additional_info as Record<string, unknown> | undefined)?.external_payment_id,
  ]
  for (const c of candidatos) {
    if (c != null && String(c).trim() !== '') return String(c)
  }
  return null
}

// Monto cobrado según Nave, para validar contra pedido.total (segunda barrera).
function naveAmount(payment: unknown): number | null {
  const p = payment as Record<string, unknown> | null
  const raw =
    (p?.amount as Record<string, unknown> | undefined)?.value ??
    ((p?.transactions as Array<Record<string, unknown>> | undefined)?.[0]?.amount as
      | Record<string, unknown>
      | undefined)?.value
  if (raw == null) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

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

    // --- Validación de pertenencia pago↔pedido (anti-falsificación) -----------
    // Sin esto, un atacante podía pagar $1 (payment APPROVED real) y apuntar ese
    // pago a CUALQUIER pedido ajeno vía external_payment_id del body. El id del
    // pedido se deriva del external_payment_id que devuelve la propia API de Nave;
    // el del body solo se usa si Nave no lo expone, y nunca puede contradecirlo.
    const naveExt = naveExternalId(payment)
    const pedidoIdSource = naveExt ?? external_payment_id

    if (naveExt != null && String(external_payment_id ?? '') !== '' && naveExt !== String(external_payment_id)) {
      console.error(
        `Nave webhook: external_payment_id no coincide (body=${external_payment_id} vs nave=${naveExt}, payment=${payment_id}) — descartado`,
      )
      return NextResponse.json({ ok: false }, { status: 200 })
    }

    const pedidoId = parseInt(pedidoIdSource)
    if (!isNaN(pedidoId)) {
      const pedido = await prisma.pedido.findUnique({
        where: { id: pedidoId },
        select: { total: true, estado: true, navePagoEstado: true },
      })

      // Segunda barrera: el monto cobrado debe coincidir con el total del pedido.
      // Solo bloquea ante discrepancia positiva; si Nave no expone el monto, sigue.
      const monto = naveAmount(payment)
      if (pedido && monto != null && Math.abs(pedido.total - monto) > 0.01) {
        console.error(
          `Nave webhook: monto no coincide (pedido ${pedidoId} total=${pedido.total} vs nave=${monto}, payment=${payment_id}) — descartado`,
        )
        return NextResponse.json({ ok: false }, { status: 200 })
      }

      const nuevoEstado = estadoMap[naveStatus] ?? 'pendiente'
      // Anti email-bombing: Nave reintenta el webhook y un atacante podría repetirlo;
      // solo avisamos al admin si el estado realmente cambió respecto a lo guardado.
      const cambioEstado = pedido?.navePagoEstado !== naveStatus || pedido?.estado !== nuevoEstado

      await prisma.pedido.update({
        where: { id: pedidoId },
        data: {
          navePagoEstado: naveStatus,
          estado: nuevoEstado,
        },
      })
      // Avisar a administración del resultado del pago (solo si hubo cambio).
      if (cambioEstado) void enviarReportePedido(pedidoId, 'pago-actualizado')

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
