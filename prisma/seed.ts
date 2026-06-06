import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Admin user
  const hash = await bcrypt.hash('muebleuno2024', 10)
  await prisma.usuario.upsert({
    where: { email: 'admin@muebleuno.com' },
    update: {},
    create: { email: 'admin@muebleuno.com', password: hash, nombre: 'Administrador', rol: 'admin' },
  })

  // Config
  await prisma.configuracion.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nombreTienda: 'Mueble UNO',
      telefono: '+54 9 379 XXX-XXXX',
      whatsapp: '5493794000000',
      email: 'ventas@muebleuno.com',
      direccion: 'Corrientes, Argentina',
      instagram: 'muebleuno',
      facebook: 'muebleuno',
      textoBanner: 'Envíos a Corrientes y alrededores — Cuotas sin interés',
    },
  })

  // Categorias
  const cats = [
    { nombre: 'Living', slug: 'living', orden: 1 },
    { nombre: 'Dormitorio', slug: 'dormitorio', orden: 2 },
    { nombre: 'Comedor', slug: 'comedor', orden: 3 },
    { nombre: 'Cocina', slug: 'cocina', orden: 4 },
    { nombre: 'Oficina', slug: 'oficina', orden: 5 },
    { nombre: 'Exterior', slug: 'exterior', orden: 6 },
  ]
  for (const cat of cats) {
    await prisma.categoria.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
  }

  console.log('Seed completado')
}

main().catch(console.error).finally(() => prisma.$disconnect())
