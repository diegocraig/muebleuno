import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get('q') ?? ''
  if (q.length < 2) return NextResponse.json([])

  const productos = await prisma.producto.findMany({
    where: {
      activo: true,
      OR: [
        { nombre: { contains: q } },
        { descripcion: { contains: q } },
      ],
    },
    include: { categoria: true },
    take: 10,
  })
  return NextResponse.json(productos)
}
