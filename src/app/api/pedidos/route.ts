import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const estado = searchParams.get('estado')

  const pedidos = await prisma.pedido.findMany({
    where: estado ? { estado } : {},
    orderBy: { creadoEn: 'desc' },
  })
  return NextResponse.json(pedidos)
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  const pedido = await prisma.pedido.create({
    data: {
      nombre: body.nombre,
      email: body.email,
      telefono: body.telefono,
      items: JSON.stringify(body.items),
      total: parseFloat(body.total),
      estado: 'pendiente',
      notas: body.notas,
    },
  })
  return NextResponse.json(pedido, { status: 201 })
}
