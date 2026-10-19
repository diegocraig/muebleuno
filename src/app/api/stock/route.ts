import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { sincronizarStock } from '@/lib/coloresServer'

export async function GET() {
  const session = await getSession()
  if (!session || session.rol !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const productos = await prisma.producto.findMany({
    select: {
      id: true,
      nombre: true,
      stock: true,
      precio: true,
      precioOferta: true,
      activo: true,
      categoria: { select: { nombre: true } },
      colores: { select: { id: true, nombre: true, stock: true }, orderBy: { orden: 'asc' } },
    },
    orderBy: { nombre: 'asc' },
  })
  return NextResponse.json(productos)
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session || session.rol !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { id, stock, precio, precioOferta, colorId } = body
  const conColores = { colores: { select: { id: true, nombre: true, stock: true }, orderBy: { orden: 'asc' as const } } }

  // Stock de un color: se actualiza el color y el producto queda con la suma.
  if (colorId !== undefined) {
    const color = await prisma.productoColor.findUnique({ where: { id: Number(colorId) } })
    if (!color) return NextResponse.json({ error: 'Color no encontrado' }, { status: 404 })
    const producto = await prisma.$transaction(async tx => {
      await tx.productoColor.update({ where: { id: color.id }, data: { stock: Math.max(0, parseInt(stock) || 0) } })
      await sincronizarStock(tx, color.productoId)
      return tx.producto.findUniqueOrThrow({ where: { id: color.productoId }, include: conColores })
    })
    return NextResponse.json(producto)
  }

  const data: Record<string, unknown> = {}
  if (stock !== undefined) {
    const tieneColores = await prisma.productoColor.count({ where: { productoId: Number(id) } })
    if (tieneColores) return NextResponse.json({ error: 'Este producto tiene colores: editá el stock de cada color.' }, { status: 400 })
    data.stock = parseInt(stock)
  }
  if (precio !== undefined) data.precio = parseFloat(precio)
  if (precioOferta !== undefined) data.precioOferta = precioOferta === '' || precioOferta === null ? null : parseFloat(precioOferta)

  const producto = await prisma.producto.update({ where: { id: Number(id) }, data, include: conColores })
  return NextResponse.json(producto)
}
