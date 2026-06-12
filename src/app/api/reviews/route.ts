import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const productoId = new URL(req.url).searchParams.get('productoId')
  const reviews = await prisma.review.findMany({
    where: { activa: true, ...(productoId ? { productoId: parseInt(productoId) } : {}) },
    orderBy: { creadaEn: 'desc' },
  })
  return NextResponse.json(reviews)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.rol !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  const review = await prisma.review.create({
    data: {
      autor: body.autor,
      ciudad: body.ciudad || null,
      texto: body.texto,
      rating: parseInt(body.rating ?? 5),
      productoId: body.productoId ? parseInt(body.productoId) : null,
      activa: body.activa ?? true,
    },
  })
  return NextResponse.json(review, { status: 201 })
}
