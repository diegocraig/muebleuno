import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminORespuesta, referenciasProductos } from '@/lib/render/servidor'
import type { LineaPedido } from '@/lib/coloresServer'
import { lineasPresupuesto, metrosMesada, normalizarEscena, normalizarPresupuesto, textoRecargos, totalesPresupuesto } from '@/lib/render/escena'
import { formatPrice } from '@/lib/utils'
import { enviarReportePedido } from '@/lib/mail'
import type { Escena } from '@/lib/render/tipos'

/**
 * Convierte un proyecto guardado en un Pedido del panel (estado "pendiente").
 * Los precios de los productos se toman de la DB, no del navegador; extras,
 * mesada, descuento y envío salen del presupuesto guardado (lo arma el admin).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await adminORespuesta()
  if (auth.error) return auth.error
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'Proyecto inválido' }, { status: 400 })
  const body = await req.json().catch(() => ({})) as { avisar?: boolean }

  const proyecto = await prisma.renderProyecto.findUnique({ where: { id } })
  if (!proyecto) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
  if (proyecto.pedidoId) return NextResponse.json({ error: `Este proyecto ya generó el pedido #${proyecto.pedidoId}` }, { status: 409 })
  if (!proyecto.cliente || !proyecto.email || !proyecto.telefono) {
    return NextResponse.json({ error: 'Completá nombre, email y teléfono del cliente y guardá antes de generar la venta.' }, { status: 400 })
  }

  const esc = normalizarEscena(JSON.parse(proyecto.datos) as Escena)
  const pres = normalizarPresupuesto(JSON.parse(proyecto.presupuesto || '{}'))

  const cantidades = new Map<number, number>()
  for (const it of esc.items) {
    if (it.origen === 'producto' && it.cuentaEnPresupuesto && it.productoId) {
      cantidades.set(it.productoId, (cantidades.get(it.productoId) ?? 0) + 1)
    }
  }
  if (!cantidades.size) return NextResponse.json({ error: 'El proyecto no tiene productos del catálogo para vender.' }, { status: 400 })

  // Precios y nombres desde la base (no del navegador). No se usa resolverLineas del
  // carrito porque exige elegir color y stock por color: acá el pedido lo arma el
  // admin y esos detalles se cierran con el cliente (quedan anotados en el pedido).
  const productos = await prisma.producto.findMany({
    where: { id: { in: [...cantidades.keys()] }, activo: true },
    select: { id: true, nombre: true, precio: true, precioOferta: true, imagenes: true, _count: { select: { colores: true } } },
  })
  const activos = new Set(productos.map(p => p.id))
  const faltantes = [...new Set(esc.items.filter(it => it.origen === 'producto' && it.cuentaEnPresupuesto && it.productoId && !activos.has(it.productoId)).map(it => it.nombre))]
  if (faltantes.length) {
    return NextResponse.json({ error: `Estos productos ya no están activos en el catálogo: ${faltantes.join(', ')}. Sacalos del proyecto o reactivalos.` }, { status: 409 })
  }
  const primeraImagen = (raw: string) => { try { const a = JSON.parse(raw); return Array.isArray(a) && typeof a[0] === 'string' ? a[0] as string : undefined } catch { return undefined } }
  const conColores = productos.filter(p => p._count.colores > 0).map(p => p.nombre)

  // Precio vigente y medidas originales desde la base: los adicionales por medida
  // especial (15 %) y color a elección (30 %) se recalculan acá, no se toman del navegador.
  const refs = await referenciasProductos([...cantidades.keys()])
  const lineas = lineasPresupuesto(esc, refs, pres)
  const imagenes = new Map(productos.map(p => [p.id, primeraImagen(p.imagenes)]))
  const nombres = new Map(productos.map(p => [p.id, p.nombre]))
  const res: { lineas: LineaPedido[] } = {
    lineas: lineas.filter(l => l.tipo === 'producto' && l.productoId).map(l => {
      const extra = textoRecargos(l)
      const nombre = nombres.get(l.productoId!) ?? l.nombre
      return { productoId: l.productoId!, cantidad: l.cantidad, nombre: extra ? `${nombre} (${extra})` : nombre, precio: l.precio, imagen: imagenes.get(l.productoId!) }
    }),
  }
  let costoEnvio = 0
  let tipoEnvioId: number | null = null
  if (pres.tipoEnvioId) {
    const te = await prisma.tipoEnvio.findFirst({ where: { id: pres.tipoEnvioId, activo: true } })
    if (te) { costoEnvio = te.costo; tipoEnvioId = te.id }
  }
  const metros = metrosMesada(esc)
  const t = totalesPresupuesto(lineas, pres, metros, costoEnvio)

  const notas: string[] = [`Generado desde el configurador 3D (/render) · proyecto #${proyecto.id} "${proyecto.nombre}".`]
  for (const l of lineas.filter(l => l.tipo === 'producto' && (l.recargoMedida || l.recargoColor))) {
    const partes = [`base ${formatPrice(l.precioBase)}`]
    if (l.recargoMedida) partes.push(`+15% medida especial ${formatPrice(l.recargoMedida)}`)
    if (l.recargoColor) partes.push(`+30% color a elección ${formatPrice(l.recargoColor)}`)
    notas.push(`${l.cantidad} × ${l.nombre}: ${partes.join(' ')} = ${formatPrice(l.precio)} c/u`)
  }
  if (t.mesada) notas.push(`Mesada: ${metros} m × ${formatPrice(pres.precioMesadaMl)} = ${formatPrice(t.mesada)}`)
  for (const e of pres.extras) notas.push(`${e.concepto}: ${e.cantidad} × ${formatPrice(e.precioUnitario)}`)
  for (const l of lineas.filter(l => l.tipo !== 'producto' && l.incluido)) notas.push(`${l.nombre}: ${l.cantidad} × ${formatPrice(l.precio)}`)
  if (t.descuento) notas.push(`Descuento ${pres.descuentoPct}%: -${formatPrice(t.descuento)}`)
  if (conColores.length) notas.push(`Color a confirmar con el cliente: ${conColores.join(', ')}`)
  if (pres.notas) notas.push(pres.notas)

  const pedido = await prisma.$transaction(async tx => {
    // Reserva el proyecto antes de crear el pedido: si dos pedidos llegan a la vez
    // (doble clic), solo el primero encuentra pedidoId en null.
    const reserva = await tx.renderProyecto.updateMany({ where: { id, pedidoId: null }, data: { estado: 'venta' } })
    if (reserva.count === 0) return null
    const ped = await tx.pedido.create({
      data: {
        nombre: proyecto.cliente!,
        email: proyecto.email!,
        telefono: proyecto.telefono!,
        items: JSON.stringify(res.lineas),
        total: t.total,
        estado: 'pendiente',
        notas: notas.join('\n'),
        tipoEnvioId,
        costoEnvio,
      },
    })
    await tx.renderProyecto.update({ where: { id }, data: { estado: 'venta', pedidoId: ped.id, total: t.total } })
    return ped
  })
  if (!pedido) return NextResponse.json({ error: 'Este proyecto ya generó un pedido.' }, { status: 409 })

  if (body.avisar) void enviarReportePedido(pedido.id, 'nuevo-contacto')
  return NextResponse.json({ pedidoId: pedido.id, total: t.total }, { status: 201 })
}
