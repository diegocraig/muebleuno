import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { sincronizarStock } from '@/lib/coloresServer'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.rol !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const pedido = await prisma.pedido.findUnique({ where: { id: Number(id) } })
  if (!pedido) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(pedido)
}

/**
 * Descuenta (signo -1) o devuelve (+1) el stock de los items de un pedido. Si la
 * línea tiene color, se mueve el stock del color y el del producto se recalcula
 * como la suma de sus colores. Un color borrado después del pedido se ignora.
 */
async function moverStock(itemsJson: string, signo: 1 | -1) {
  const items = JSON.parse(itemsJson) as { productoId: number; cantidad: number; colorId?: number }[]
  await prisma.$transaction(async tx => {
    for (const item of items) {
      const delta = { [signo < 0 ? 'decrement' : 'increment']: item.cantidad }
      if (item.colorId) {
        await tx.productoColor.updateMany({ where: { id: item.colorId, productoId: item.productoId }, data: { stock: delta } })
        await sincronizarStock(tx, item.productoId)
      } else {
        await tx.producto.updateMany({ where: { id: item.productoId }, data: { stock: delta } })
      }
    }
  })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.rol !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const actual = await prisma.pedido.findUnique({ where: { id: Number(id) } })
  if (!actual) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const pedido = await prisma.pedido.update({
    where: { id: Number(id) },
    data: { estado: body.estado, notas: body.notas },
  })

  if (body.estado !== actual.estado) {
    const completa = body.estado === 'completado' && actual.estado !== 'completado'
    const revierte = actual.estado === 'completado' && body.estado !== 'completado'
    if (completa || revierte) await moverStock(actual.items, completa ? -1 : 1)
  }

  return NextResponse.json(pedido)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.rol !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.pedido.delete({ where: { id: Number(id) } })
  return NextResponse.json({ ok: true })
}
