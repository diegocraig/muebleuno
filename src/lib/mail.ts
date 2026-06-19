import { spawn } from 'child_process'
import { prisma } from './prisma'
import { formatPrice } from './utils'

// Envío de correo vía msmtp (Gmail 587, configurado en ~/.msmtprc del server).
// El From debe ser la cuenta de Gmail autenticada; el Reply-To se apunta al
// cliente para poder responderle directo.
const FROM = 'Mueble UNO <diegocraig@gmail.com>'
const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || 'administracion@muebleuno.com'
const TZ = 'America/Argentina/Buenos_Aires'

function encodeSubject(s: string): string {
  // RFC 2047 encoded-word para asuntos con acentos/emoji.
  return `=?UTF-8?B?${Buffer.from(s, 'utf8').toString('base64')}?=`
}

export function enviarMail(opts: { to?: string; subject: string; html: string; replyTo?: string }): Promise<void> {
  const to = opts.to || ADMIN_EMAIL
  const message = [
    `From: ${FROM}`,
    `To: ${to}`,
    opts.replyTo ? `Reply-To: ${opts.replyTo}` : null,
    `Subject: ${encodeSubject(opts.subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    opts.html,
  ].filter((l): l is string => l !== null).join('\r\n')

  return new Promise((resolve) => {
    try {
      const child = spawn('msmtp', ['-t'], { stdio: ['pipe', 'ignore', 'ignore'] })
      child.on('error', (e) => { console.error('msmtp spawn error:', e); resolve() })
      child.on('close', () => resolve())
      child.stdin.on('error', () => resolve())
      child.stdin.write(message)
      child.stdin.end()
    } catch (e) {
      console.error('enviarMail error:', e)
      resolve()
    }
  })
}

interface ItemRaw { productoId: number; cantidad: number; nombre?: string; precio?: number }

type TipoEvento = 'nuevo-tarjeta' | 'nuevo-contacto' | 'pago-actualizado'

const ASUNTOS: Record<TipoEvento, (id: number) => string> = {
  'nuevo-tarjeta': (id) => `🛒 Nuevo intento de compra (pago con tarjeta/QR) — Pedido #${id}`,
  'nuevo-contacto': (id) => `🛒 Nuevo pedido (solicitud de contacto) — Pedido #${id}`,
  'pago-actualizado': (id) => `💳 Pago actualizado — Pedido #${id}`,
}

/**
 * Arma y envía a administración un reporte completo del pedido. Tolerante a
 * fallos: nunca lanza (un error de correo no debe romper el checkout).
 */
export async function enviarReportePedido(pedidoId: number, evento: TipoEvento): Promise<void> {
  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: { tipoEnvio: true },
    })
    if (!pedido) return

    const items: ItemRaw[] = JSON.parse(pedido.items || '[]')

    // Los pedidos de Nave guardan sólo {productoId, cantidad}; completamos
    // nombre y precio desde la DB cuando falten.
    const ids = items.map(i => i.productoId).filter(Boolean)
    const productos = ids.length
      ? await prisma.producto.findMany({
          where: { id: { in: ids } },
          select: { id: true, nombre: true, precio: true, precioOferta: true },
        })
      : []
    const pmap = new Map(productos.map(p => [p.id, p]))

    const lineas = items.map(i => {
      const prod = pmap.get(i.productoId)
      const nombre = i.nombre ?? prod?.nombre ?? `Producto #${i.productoId}`
      const precio = i.precio ?? prod?.precioOferta ?? prod?.precio ?? 0
      return { nombre, cantidad: i.cantidad, precio, subtotal: precio * i.cantidad }
    })
    const subtotalProductos = lineas.reduce((a, l) => a + l.subtotal, 0)

    const fecha = new Date(pedido.creadoEn).toLocaleString('es-AR', {
      timeZone: TZ, dateStyle: 'full', timeStyle: 'short',
    })

    const telLimpio = pedido.telefono.replace(/\D/g, '')
    const row = (k: string, v: string) =>
      `<tr><td style="padding:4px 12px 4px 0;color:#666;white-space:nowrap;vertical-align:top">${k}</td><td style="padding:4px 0;font-weight:600">${v}</td></tr>`

    const itemsHtml = lineas.map(l => `
      <tr>
        <td style="padding:6px 0;border-bottom:1px solid #eee">${escapeHtml(l.nombre)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">×${l.cantidad}</td>
        <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${formatPrice(l.subtotal)}</td>
      </tr>`).join('')

    const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:auto;color:#222">
  <h2 style="color:#c81e1e;margin:0 0 4px">Pedido #${pedido.id}</h2>
  <p style="margin:0 0 16px;color:#666">${fecha}</p>

  <table style="border-collapse:collapse;font-size:14px;margin-bottom:16px">
    ${row('Estado pedido', escapeHtml(pedido.estado))}
    ${pedido.navePagoEstado ? row('Estado de pago (Nave)', escapeHtml(pedido.navePagoEstado)) : ''}
    ${row('Nombre', escapeHtml(pedido.nombre))}
    ${row('Email', `<a href="mailto:${escapeHtml(pedido.email)}">${escapeHtml(pedido.email)}</a>`)}
    ${row('Teléfono', `${escapeHtml(pedido.telefono)} &nbsp; <a href="https://wa.me/${telLimpio}">WhatsApp</a>`)}
    ${pedido.notas ? row('Notas', escapeHtml(pedido.notas)) : ''}
    ${row('Tipo de envío', pedido.tipoEnvio ? escapeHtml(pedido.tipoEnvio.nombre) : '—')}
    ${row('Costo de envío', pedido.costoEnvio ? formatPrice(pedido.costoEnvio) : 'Gratis / —')}
    ${pedido.navePaymentRequestId ? row('ID pago Nave', escapeHtml(pedido.navePaymentRequestId)) : ''}
  </table>

  <h3 style="margin:0 0 8px">Productos</h3>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <tbody>${itemsHtml}</tbody>
    <tfoot>
      <tr><td colspan="2" style="padding:8px 8px 2px 0;text-align:right;color:#666">Subtotal productos</td><td style="padding:8px 0 2px;text-align:right">${formatPrice(subtotalProductos)}</td></tr>
      <tr><td colspan="2" style="padding:2px 8px 2px 0;text-align:right;color:#666">Envío</td><td style="padding:2px 0;text-align:right">${pedido.costoEnvio ? formatPrice(pedido.costoEnvio) : '—'}</td></tr>
      <tr><td colspan="2" style="padding:8px 8px 0 0;text-align:right;font-weight:700;font-size:16px">Total</td><td style="padding:8px 0 0;text-align:right;font-weight:700;font-size:16px;color:#c81e1e">${formatPrice(pedido.total)}</td></tr>
    </tfoot>
  </table>

  <p style="margin-top:24px;font-size:12px;color:#999">Reporte automático de muebleuno.com — Pedido #${pedido.id}. Respondé este correo para contactar al cliente.</p>
</div>`

    await enviarMail({ subject: ASUNTOS[evento](pedido.id), html, replyTo: pedido.email })
  } catch (e) {
    console.error('enviarReportePedido error:', e)
  }
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}
