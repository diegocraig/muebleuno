import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminORespuesta } from '@/lib/render/servidor'
import { resolverLineas } from '@/lib/coloresServer'
import { lineasPresupuesto, metrosMesada, totalesPresupuesto, PRESUPUESTO_DEFAULT } from '@/lib/render/escena'
import { formatPrice } from '@/lib/utils'
import { enviarReportePedido } from '@/lib/mail'
import type { Escena, Presupuesto } from '@/lib/render/tipos'

/**
 * Convierte un proyecto guardado en un Pedido del panel (estado "pendiente").
 * Los precios de los productos se toman de la DB, no del navegador; extras,
 * mesada, descuento y envío salen del presupuesto guardado (lo arma el admin).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await adminORespuesta()
  if (auth.error) return auth.error
  const id = Number((await params).id)
  const body = await req.json().catch(() => ({})) as { avisar?: boolean }

  const proyecto = await prisma.renderProyecto.findUnique({ where: { id } })
  if (!proyecto) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
  if (proyecto.pedidoId) return NextResponse.json({ error: `Este proyecto ya generó el pedido #${proyecto.pedidoId}` }, { status: 409 })
  if (!proyecto.cliente || !proyecto.email || !proyecto.telefono) {
    return NextResponse.json({ error: 'Completá nombre, email y teléfono del cliente y guardá antes de generar la venta.' }, { status: 400 })
  }

  const esc = JSON.parse(proyecto.datos) as Escena
  const pres = { ...PRESUPUESTO_DEFAULT, ...(JSON.parse(proyecto.presupuesto || '{}') as Partial<Presupuesto>) }

  const cantidades = new Map<number, number>()
  for (const it of esc.items) {
    if (it.origen === 'producto' && it.cuentaEnPresupuesto && it.productoId) {
      cantidades.set(it.productoId, (cantidades.get(it.productoId) ?? 0) + 1)
    }
  }
  const res = await resolverLineas([...cantidades].map(([productoId, cantidad]) => ({ productoId, cantidad })))
  if ('error' in res) return NextResponse.json({ error: res.error }, { status: 400 })

  const precios = new Map(res.lineas.map(l => [l.productoId, l.precio]))
  const lineas = lineasPresupuesto(esc, precios, pres)
  let costoEnvio = 0
  let tipoEnvioId: number | null = null
  if (pres.tipoEnvioId) {
    const te = await prisma.tipoEnvio.findFirst({ where: { id: pres.tipoEnvioId, activo: true } })
    if (te) { costoEnvio = te.costo; tipoEnvioId = te.id }
  }
  const metros = metrosMesada(esc)
  const t = totalesPresupuesto(lineas, pres, metros, costoEnvio)

  const notas: string[] = [`Generado desde el configurador 3D (/render) · proyecto #${proyecto.id} "${proyecto.nombre}".`]
  if (t.mesada) notas.push(`Mesada: ${metros} m × ${formatPrice(pres.precioMesadaMl)} = ${formatPrice(t.mesada)}`)
  for (const e of pres.extras) notas.push(`${e.concepto}: ${e.cantidad} × ${formatPrice(e.precioUnitario)}`)
  for (const l of lineas.filter(l => l.tipo !== 'producto' && l.incluido)) notas.push(`${l.nombre}: ${l.cantidad} × ${formatPrice(l.precio)}`)
  if (t.descuento) notas.push(`Descuento ${pres.descuentoPct}%: -${formatPrice(t.descuento)}`)
  if (pres.notas) notas.push(pres.notas)

  const pedido = await prisma.$transaction(async tx => {
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

  if (body.avisar) void enviarReportePedido(pedido.id, 'nuevo-contacto')
  return NextResponse.json({ pedidoId: pedido.id, total: t.total }, { status: 201 })
}
