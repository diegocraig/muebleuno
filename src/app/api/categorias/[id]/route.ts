import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { slugify } from '@/lib/utils'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const slug = body.slug || slugify(body.nombre)

  const categoria = await prisma.categoria.update({
    where: { id: Number(id) },
    data: {
      nombre: body.nombre,
      slug,
      imagen: body.imagen,
      orden: parseInt(body.orden ?? 0),
      activa: body.activa ?? true,
    },
  })
  return NextResponse.json(categoria)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.categoria.delete({ where: { id: Number(id) } })
  return NextResponse.json({ ok: true })
}
