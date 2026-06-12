import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.rol !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const pedido = await prisma.pedido.findUnique({ where: { id: Number(id) } })
  if (!pedido) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(pedido)
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
    const items = JSON.parse(actual.items) as { productoId: number; cantidad: number }[]
    if (body.estado === 'completado' && actual.estado !== 'completado') {
      for (const item of items) {
        await prisma.producto.update({
          where: { id: item.productoId },
          data: { stock: { decrement: item.cantidad } },
        })
      }
    } else if (actual.estado === 'completado' && body.estado !== 'completado') {
      for (const item of items) {
        await prisma.producto.update({
          where: { id: item.productoId },
          data: { stock: { increment: item.cantidad } },
        })
      }
    }
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
