import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const hash = await bcrypt.hash('muebleuno2024', 10)
  await prisma.usuario.upsert({
    where: { email: 'admin@muebleuno.com' },
    update: {},
    create: { email: 'admin@muebleuno.com', password: hash, nombre: 'Administrador', rol: 'admin' },
  })

  await prisma.configuracion.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nombreTienda: 'Mueble UNO',
      telefono: '+54 9 379 4000000',
      whatsapp: '5491126484463',
      email: 'ventas@muebleuno.com',
      direccion: 'Doidamia Palacios 1468, El Palomar, Buenos Aires',
      instagram: 'muebleuno',
      facebook: 'muebleuno',
      textoBanner: 'Envíos a todo el país — Cuotas sin interés',
    },
  })

  const cats = ['Living', 'Dormitorio', 'Comedor', 'Cocina', 'Oficina', 'Exterior']
  for (let i = 0; i < cats.length; i++) {
    const nombre = cats[i]
    const slug = nombre.toLowerCase()
    await prisma.categoria.upsert({
      where: { slug },
      update: {},
      create: { nombre, slug, orden: i + 1 },
    })
  }

  return NextResponse.json({ ok: true, mensaje: 'Base de datos inicializada' })
}
