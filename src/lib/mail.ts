import { spawn } from 'child_process'
import { prisma } from './prisma'
import { formatPrice, displayPedidoId } from './utils'

// Envío de correo vía msmtp (Gmail/Workspace 587, configurado en ~/.msmtprc del server).
// El From debe ser la cuenta autenticada en msmtp (ventas@muebleuno.com); el
// Reply-To se apunta al cliente para poder responderle directo.
const FROM = 'Mueble UNO <ventas@muebleuno.com>'
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
  'nuevo-tarjeta': (id) => `🛒 Nuevo intento de compra (pago con tarjeta/QR) — Pedido #${displayPedidoId(id)}`,
  'nuevo-contacto': (id) => `🛒 Nuevo pedido (solicitud de contacto) — Pedido #${displayPedidoId(id)}`,
  'pago-actualizado': (id) => `💳 Pago actualizado — Pedido #${displayPedidoId(id)}`,
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
  <h2 style="color:#c81e1e;margin:0 0 4px">Pedido #${displayPedidoId(pedido.id)}</h2>
  <p style="margin:0 0 16px;color:#666">${fecha}</p>

  <table style="border-collapse:collapse;font-size:14px;margin-bottom:16px">
    ${row('Estado pedido', escapeHtml(pedido.estado))}
    ${pedido.navePagoEstado ? row('Estado de pago (Nave)', escapeHtml(pedido.navePagoEstado)) : ''}
    ${row('Nombre', escapeHtml(pedido.nombre))}
    ${row('Email', `<a href="mailto:${escapeHtml(pedido.email)}">${escapeHtml(pedido.email)}</a>`)}
    ${row('Teléfono', `${escapeHtml(pedido.telefono)} &nbsp; <a href="https://wa.me/${telLimpio}">WhatsApp</a>`)}
    ${pedido.dni ? row('DNI / CUIT', escapeHtml(pedido.dni)) : ''}
    ${pedido.direccion ? row('Dirección de envío', escapeHtml(pedido.direccion).replace(/\n/g, '<br>')) : ''}
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

  <p style="margin-top:24px;font-size:12px;color:#999">Reporte automático de muebleuno.com — Pedido #${displayPedidoId(pedido.id)}. Respondé este correo para contactar al cliente.</p>
</div>`

    await enviarMail({ subject: ASUNTOS[evento](pedido.id), html, replyTo: pedido.email })
  } catch (e) {
    console.error('enviarReportePedido error:', e)
  }
}

function capitalizar(s: string): string {
  return s.trim().split(/\s+/).map(w => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w).join(' ')
}

/**
 * Envía al COMPRADOR un correo de agradecimiento con el detalle de su compra,
 * tras un pago aprobado. Tolerante a fallos: nunca lanza.
 */
export async function enviarConfirmacionCompra(pedidoId: number): Promise<void> {
  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: { tipoEnvio: true },
    })
    if (!pedido || !pedido.email) return

    const items: ItemRaw[] = JSON.parse(pedido.items || '[]')
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
      return { nombre, cantidad: i.cantidad, subtotal: precio * i.cantidad }
    })
    const subtotalProductos = lineas.reduce((a, l) => a + l.subtotal, 0)
    const primerNombre = capitalizar(pedido.nombre.split(/\s+/)[0] || pedido.nombre)
    const telLimpio = pedido.telefono.replace(/\D/g, '')

    const itemsHtml = lineas.map(l => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0">${escapeHtml(l.nombre)}</td>
          <td style="padding:8px 8px;border-bottom:1px solid #f0f0f0;text-align:center">${l.cantidad}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;white-space:nowrap">${formatPrice(l.subtotal)}</td>
        </tr>`).join('')

    const envioRow = pedido.costoEnvio
      ? `<tr><td colspan="2" style="padding:2px 8px 2px 0;text-align:right;color:#888">Envío${pedido.tipoEnvio ? ` (${escapeHtml(pedido.tipoEnvio.nombre)})` : ''}</td><td style="padding:2px 0;text-align:right;white-space:nowrap">${formatPrice(pedido.costoEnvio)}</td></tr>`
      : ''

    const direccionBloque = pedido.direccion
      ? `<div style="padding:0 28px"><div style="background:#fff8f0;border:1px solid #f0e0cc;border-radius:12px;padding:14px 18px"><p style="margin:0 0 4px;font-weight:700;color:#222">📍 Dirección de envío</p><p style="margin:0;color:#555;font-size:14px;line-height:1.5">${escapeHtml(pedido.direccion).replace(/\n/g, '<br>')}</p></div></div>`
      : ''

    const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:auto;color:#222;background:#ffffff">
  <div style="background:#C0272D;padding:24px;text-align:center">
    <span style="color:#fff;font-size:22px;font-weight:800;letter-spacing:.5px">MuebleUno</span>
  </div>

  <div style="padding:28px 28px 8px">
    <h1 style="font-size:22px;margin:0 0 6px;color:#222">¡Gracias por tu compra, ${escapeHtml(primerNombre)}! 🎉</h1>
    <p style="margin:0 0 16px;color:#555;line-height:1.5">
      Tu pago fue <strong style="color:#1a8f3c">confirmado</strong>. Ya registramos tu pedido
      <strong>#${displayPedidoId(pedido.id)}</strong>. <strong>Nos contactaremos a la brevedad para coordinar la entrega.</strong>
    </p>
  </div>
  ${direccionBloque}

  <div style="padding:0 28px">
    <h3 style="margin:18px 0 8px;font-size:15px;color:#222">Detalle de tu compra</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead>
        <tr style="color:#888;text-align:left">
          <th style="padding:6px 0;border-bottom:2px solid #eee;font-weight:600">Producto</th>
          <th style="padding:6px 8px;border-bottom:2px solid #eee;font-weight:600;text-align:center">Cant.</th>
          <th style="padding:6px 0;border-bottom:2px solid #eee;font-weight:600;text-align:right">Subtotal</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot>
        <tr><td colspan="2" style="padding:8px 8px 2px 0;text-align:right;color:#888">Subtotal productos</td><td style="padding:8px 0 2px;text-align:right;white-space:nowrap">${formatPrice(subtotalProductos)}</td></tr>
        ${envioRow}
        <tr><td colspan="2" style="padding:10px 8px 0 0;text-align:right;font-weight:800;font-size:16px">Total</td><td style="padding:10px 0 0;text-align:right;font-weight:800;font-size:16px;color:#C0272D;white-space:nowrap">${formatPrice(pedido.total)}</td></tr>
      </tfoot>
    </table>
  </div>

  <div style="padding:24px 28px">
    <div style="background:#f7f7f7;border-radius:12px;padding:16px 18px">
      <p style="margin:0 0 4px;font-weight:700;color:#222">¿Dudas sobre tu pedido?</p>
      <p style="margin:0;color:#555;font-size:14px;line-height:1.5">
        Escribinos a <a href="mailto:ventas@muebleuno.com" style="color:#C0272D">ventas@muebleuno.com</a>${telLimpio ? `
        o por WhatsApp al <a href="https://wa.me/${telLimpio}" style="color:#C0272D">${escapeHtml(pedido.telefono)}</a>` : ''}.
      </p>
    </div>
  </div>

  <div style="background:#fafafa;padding:18px 28px;text-align:center;border-top:1px solid #eee">
    <p style="margin:0;font-size:12px;color:#aaa">MuebleUno · Gracias por confiar en nosotros · muebleuno.com</p>
  </div>
</div>`

    await enviarMail({
      to: pedido.email,
      subject: `¡Gracias por tu compra! — Pedido #${displayPedidoId(pedido.id)}`,
      html,
    })
  } catch (e) {
    console.error('enviarConfirmacionCompra error:', e)
  }
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}
