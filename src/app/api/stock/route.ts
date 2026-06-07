import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const productos = await prisma.producto.findMany({
    select: {
      id: true,
      nombre: true,
      stock: true,
      precio: true,
      precioOferta: true,
      activo: true,
      categoria: { select: { nombre: true } },
    },
    orderBy: { nombre: 'asc' },
  })
  return NextResponse.json(productos)
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { id, stock, precio, precioOferta } = body

  const data: Record<string, unknown> = {}
  if (stock !== undefined) data.stock = parseInt(stock)
  if (precio !== undefined) data.precio = parseFloat(precio)
  if (precioOferta !== undefined) data.precioOferta = precioOferta === '' || precioOferta === null ? null : parseFloat(precioOferta)

  const producto = await prisma.producto.update({ where: { id: Number(id) }, data })
  return NextResponse.json(producto)
}
